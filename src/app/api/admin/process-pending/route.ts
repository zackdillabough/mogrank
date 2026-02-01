import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"
import { sendDiscordDM } from "@/lib/discord"
import { stripe } from "@/lib/stripe"

// Only available in test mode - manually process a pending checkout
export async function POST(request: NextRequest) {
  // Only allow in test mode
  if (process.env.STRIPE_MODE !== "test") {
    return NextResponse.json(
      { error: "This endpoint is only available in test mode" },
      { status: 403 }
    )
  }

  const session = await auth()
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { pending_checkout_id, amount, stripe_session_id, stripe_payment_intent_id } = body

    if (!pending_checkout_id) {
      return NextResponse.json({ error: "pending_checkout_id required" }, { status: 400 })
    }

    // Fetch pending checkout data
    const { data: pendingCheckout, error: pendingError } = await supabase
      .from("pending_checkouts")
      .select("*")
      .eq("id", pending_checkout_id)
      .single()

    if (pendingError || !pendingCheckout) {
      return NextResponse.json(
        { error: "Pending checkout not found", details: pendingError },
        { status: 404 }
      )
    }

    const { discord_id, discord_username, discord_avatar, package_id, package_name, availability } = pendingCheckout

    // Use provided Stripe IDs or try to retrieve from Stripe API
    const finalStripeSessionId = stripe_session_id || pendingCheckout.stripe_session_id || `manual_test_${pending_checkout_id}`

    // Try to get the payment intent ID from Stripe if we have a real session ID
    let finalPaymentIntentId = stripe_payment_intent_id
    if (!finalPaymentIntentId && finalStripeSessionId && finalStripeSessionId.startsWith("cs_")) {
      try {
        const stripeSession = await stripe.checkout.sessions.retrieve(finalStripeSessionId)
        if (stripeSession.payment_intent) {
          finalPaymentIntentId = typeof stripeSession.payment_intent === "string"
            ? stripeSession.payment_intent
            : stripeSession.payment_intent.id
        }
      } catch (stripeError) {
        console.error("Could not retrieve Stripe session:", stripeError)
      }
    }

    // Fall back to manual test ID if we couldn't get the real one
    if (!finalPaymentIntentId) {
      finalPaymentIntentId = `manual_test_pi_${pending_checkout_id}`
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        stripe_session_id: finalStripeSessionId,
        stripe_payment_intent_id: finalPaymentIntentId,
        discord_id,
        discord_username,
        discord_avatar,
        package_id,
        package_name,
        amount: amount || 0,
        availability,
        status: "in_queue",
        paid_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json(
        { error: "Failed to create order", details: orderError },
        { status: 500 }
      )
    }

    // Create queue item
    const { error: queueError } = await supabase.from("queue").insert({
      order_id: order.id,
      discord_id,
      discord_username,
      package_id,
      package_name,
      availability,
      status: "new",
    })

    if (queueError) {
      console.error("Error creating queue item:", queueError)
    }

    // Delete pending checkout (cleanup)
    await supabase
      .from("pending_checkouts")
      .delete()
      .eq("id", pending_checkout_id)

    // Send Discord DM (same message as normal webhook flow)
    if (discord_id) {
      await sendDiscordDM(
        discord_id,
        `Your payment for **${package_name}** has been confirmed! You've been added to the queue. Check your dashboard for updates: ${process.env.NEXTAUTH_URL}/dashboard`
      )
    }

    return NextResponse.json({
      success: true,
      order,
      message: "Pending checkout processed successfully",
    })
  } catch (error) {
    console.error("Process pending error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// List all pending checkouts (test mode only)
export async function GET() {
  if (process.env.STRIPE_MODE !== "test") {
    return NextResponse.json(
      { error: "This endpoint is only available in test mode" },
      { status: 403 }
    )
  }

  const session = await auth()
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()

    const { data: pendingCheckouts, error } = await supabase
      .from("pending_checkouts")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch pending checkouts" }, { status: 500 })
    }

    return NextResponse.json({ pendingCheckouts })
  } catch (error) {
    console.error("Fetch pending checkouts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
