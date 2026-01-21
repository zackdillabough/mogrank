import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { sendDiscordDM } from "@/lib/discord"
import type { RampWebhookPayload } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body: RampWebhookPayload = await request.json()

    // Log webhook for debugging
    console.log("Ramp webhook received:", JSON.stringify(body, null, 2))

    const { type, purchase } = body

    // Handle different event types
    if (type === "CREATED" || type === "RELEASED") {
      const rampOrderId = purchase.id
      const status = purchase.status

      // Map Ramp status to our order status
      let orderStatus: string = "pending_payment"
      if (status === "RELEASED" || status === "FIAT_RECEIVED") {
        orderStatus = "paid"
      } else if (status === "CANCELLED" || status === "EXPIRED") {
        orderStatus = "refunded"
      } else if (status === "PAYMENT_FAILED") {
        orderStatus = "dispute"
      }

      // Update order in database
      const { data: order, error: updateError } = await supabase
        .from("orders")
        .update({
          status: orderStatus,
          crypto_amount: purchase.cryptoAmount,
          crypto_currency: purchase.asset.symbol,
          paid_at: orderStatus === "paid" ? new Date().toISOString() : null,
        })
        .eq("ramp_order_id", rampOrderId)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating order:", updateError)
        return NextResponse.json(
          { error: "Failed to update order" },
          { status: 500 }
        )
      }

      // If payment completed, create queue item and notify user
      if (orderStatus === "paid" && order) {
        // Create queue item
        const { error: queueError } = await supabase.from("queue").insert({
          order_id: order.id,
          discord_id: order.discord_id,
          discord_username: order.discord_username,
          package_id: order.package_id,
          package_name: order.package_name,
          status: "new",
        })

        if (queueError) {
          console.error("Error creating queue item:", queueError)
        }

        // Update order status to in_queue
        await supabase
          .from("orders")
          .update({ status: "in_queue" })
          .eq("id", order.id)

        // Send Discord DM if user has linked Discord
        if (order.discord_id) {
          await sendDiscordDM(
            order.discord_id,
            `Your payment for **${order.package_name}** has been confirmed! You've been added to the queue. Check your dashboard for updates: ${process.env.NEXTAUTH_URL}/dashboard`
          )
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Verify webhook signature (Ramp uses HMAC)
// Note: Implement signature verification if Ramp provides signing secrets
