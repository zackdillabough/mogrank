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
    const { packageId } = body

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
        discord_id: session.user.discordId,
        discord_username: session.user.discordUsername || "",
        discord_avatar: session.user.discordAvatar || "",
        package_id: packageId,
        package_name: pkg.name,
      },
      allow_promotion_codes: true,
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/packages`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
