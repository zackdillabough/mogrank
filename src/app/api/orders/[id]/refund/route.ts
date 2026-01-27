import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { stripe } from "@/lib/stripe"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { deductFees } = body

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

    if (!order.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: "No payment intent found for this order" },
        { status: 400 }
      )
    }

    if (order.status === "refunded") {
      return NextResponse.json(
        { error: "Order already refunded" },
        { status: 400 }
      )
    }

    // Calculate refund amount
    const orderAmount = Number(order.amount)
    let refundAmount: number

    if (deductFees) {
      // Deduct Stripe fee: 2.9% + $0.30
      const stripeFee = orderAmount * 0.029 + 0.30
      refundAmount = Math.max(0, orderAmount - stripeFee)
    } else {
      refundAmount = orderAmount
    }

    // Round to 2 decimal places and convert to cents
    const refundAmountCents = Math.round(refundAmount * 100)

    // Create Stripe refund
    await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      amount: refundAmountCents,
    })

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
      return NextResponse.json(
        { error: "Refund processed but failed to update order status" },
        { status: 500 }
      )
    }

    // Mark queue item as finished if exists
    await supabase
      .from("queue")
      .update({ status: "finished" })
      .eq("order_id", id)

    return NextResponse.json({
      success: true,
      refunded_amount: refundAmount,
    })
  } catch (error) {
    console.error("Refund error:", error)
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    )
  }
}
