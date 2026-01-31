import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { stripe } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.discordId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { packageId, availability } = body

    // Fetch package details
    const supabase = getSupabaseAdmin()
    const { data: pkg, error: pkgError } = await supabase
      .from("packages")
      .select("*")
      .eq("id", packageId)
      .eq("active", true)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 })
    }

    // Store availability in pending_checkouts table to avoid Stripe metadata size limits
    const { data: pendingCheckout, error: pendingError } = await supabase
      .from("pending_checkouts")
      .insert({
        discord_id: session.user.discordId,
        discord_username: session.user.discordUsername || "",
        discord_avatar: session.user.discordAvatar || "",
        package_id: packageId,
        package_name: pkg.name,
        availability,
      })
      .select()
      .single()

    if (pendingError) {
      console.error("Error creating pending checkout:", pendingError)
      return NextResponse.json(
        { error: "Failed to create checkout" },
        { status: 500 }
      )
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: pkg.name,
              description: pkg.subtitle || undefined,
            },
            unit_amount: Math.round(pkg.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        pending_checkout_id: pendingCheckout.id,
      },
      allow_promotion_codes: true,
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/packages`,
    })

    // Update pending checkout with stripe session id
    await supabase
      .from("pending_checkouts")
      .update({ stripe_session_id: checkoutSession.id })
      .eq("id", pendingCheckout.id)

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
