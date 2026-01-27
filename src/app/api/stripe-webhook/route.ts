import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { stripe, stripeWebhookSecret } from "@/lib/stripe"
import { sendDiscordDM } from "@/lib/discord"
import type Stripe from "stripe"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.payment_status !== "paid") {
          break
        }

        const metadata = session.metadata
        if (!metadata) {
          console.error("No metadata on checkout session:", session.id)
          break
        }

        const { discord_id, discord_username, discord_avatar, package_id, package_name } = metadata
        const amount = (session.amount_total || 0) / 100 // Convert from cents

        // Create order
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            stripe_session_id: session.id,
            stripe_payment_intent_id: typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id || null,
            discord_id,
            discord_username,
            discord_avatar,
            package_id,
            package_name,
            amount,
            status: "in_queue",
            paid_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (orderError) {
          console.error("Error creating order:", orderError)
          break
        }

        // Create queue item
        const { error: queueError } = await supabase.from("queue").insert({
          order_id: order.id,
          discord_id,
          discord_username,
          package_id,
          package_name,
          status: "new",
        })

        if (queueError) {
          console.error("Error creating queue item:", queueError)
        }

        // Update order status to in_queue (already set, but keep consistent with queue creation)
        // Send Discord DM
        if (discord_id) {
          await sendDiscordDM(
            discord_id,
            `Your payment for **${package_name}** has been confirmed! You've been added to the queue. Check your dashboard for updates: ${process.env.NEXTAUTH_URL}/dashboard`
          )
        }

        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id

        if (!paymentIntentId) break

        // Update order status if refunded externally (e.g., from Stripe Dashboard)
        const { error } = await supabase
          .from("orders")
          .update({
            status: "refunded",
            refunded_amount: (charge.amount_refunded || 0) / 100,
          })
          .eq("stripe_payment_intent_id", paymentIntentId)

        if (error) {
          console.error("Error updating refunded order:", error)
        }

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}
