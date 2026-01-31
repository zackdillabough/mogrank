import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.discordId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { availability } = body

    const supabase = getSupabaseAdmin()

    // Get the order and verify ownership
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

    // Only allow updating availability for orders that are in_queue or scheduled
    if (!["in_queue", "scheduled"].includes(order.status)) {
      return NextResponse.json(
        { error: "Cannot update availability for orders that have already started" },
        { status: 400 }
      )
    }

    // Update the order's availability
    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({ availability })
      .eq("id", id)

    if (updateOrderError) {
      console.error("Error updating order availability:", updateOrderError)
      return NextResponse.json({ error: "Failed to update availability" }, { status: 500 })
    }

    // Also update the associated queue item
    const { error: updateQueueError } = await supabase
      .from("queue")
      .update({ availability })
      .eq("order_id", id)

    if (updateQueueError) {
      console.error("Error updating queue availability:", updateQueueError)
      // Don't fail the request, the order was already updated
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Availability update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
