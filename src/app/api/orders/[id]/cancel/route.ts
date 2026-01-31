import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { stripe } from "@/lib/stripe"
import { sendDiscordDM } from "@/lib/discord"

// Cancellation policy:
// - "new" or "scheduled" status: Full refund minus Stripe processing fees
// - "in_progress" or later: No refund allowed

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.discordId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabaseAdmin()

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Verify the user owns this order
    if (order.discord_id !== session.user.discordId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check if already refunded
    if (order.status === "refunded") {
      return NextResponse.json(
        { error: "Order already cancelled and refunded" },
        { status: 400 }
      )
    }

    // Get the queue item to check its status
    const { data: queueItem } = await supabase
      .from("queue")
      .select("status")
      .eq("order_id", id)
      .single()

    const queueStatus = queueItem?.status || "new"

    // Check cancellation eligibility based on queue status
    if (!["new", "scheduled"].includes(queueStatus)) {
      return NextResponse.json(
        {
          error: "Cannot cancel order",
          message: "Orders that are in progress or completed cannot be cancelled. Please contact support if you have concerns."
        },
        { status: 400 }
      )
    }

    // Check for valid payment intent
    if (!order.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: "No payment intent found for this order" },
        { status: 400 }
      )
    }

    // Calculate refund amount (full amount minus Stripe fees)
    const orderAmount = Number(order.amount)
    // Stripe fee: 2.9% + $0.30
    const stripeFee = orderAmount * 0.029 + 0.30
    const refundAmount = Math.max(0, orderAmount - stripeFee)

    // Round to 2 decimal places and convert to cents
    const refundAmountCents = Math.round(refundAmount * 100)

    // Create Stripe refund
    try {
      await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent_id,
        amount: refundAmountCents,
      })
    } catch (stripeError) {
      console.error("Stripe refund error:", stripeError)
      return NextResponse.json(
        { error: "Failed to process refund. Please contact support." },
        { status: 500 }
      )
    }

    // Update order status
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "refunded",
        refunded_amount: refundAmount,
      })
      .eq("id", id)

    if (updateError) {
      console.error("Error updating order after refund:", updateError)
      // Refund was processed, but DB update failed
      return NextResponse.json(
        {
          error: "Refund processed but failed to update order status. Please contact support.",
          refunded_amount: refundAmount
        },
        { status: 500 }
      )
    }

    // Mark queue item as finished
    await supabase
      .from("queue")
      .update({ status: "finished" })
      .eq("order_id", id)

    // Send confirmation DM
    if (order.discord_id) {
      await sendDiscordDM(
        order.discord_id,
        `Your order for **${order.package_name}** has been cancelled. A refund of **$${refundAmount.toFixed(2)}** (original amount minus processing fees) has been issued and should appear in your account within 5-10 business days.`
      )
    }

    return NextResponse.json({
      success: true,
      refunded_amount: refundAmount,
      original_amount: orderAmount,
      fees_deducted: stripeFee,
    })
  } catch (error) {
    console.error("Cancel order error:", error)
    return NextResponse.json(
      { error: "Failed to cancel order" },
      { status: 500 }
    )
  }
}
