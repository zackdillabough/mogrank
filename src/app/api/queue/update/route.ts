import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"
import { sendQueueUpdateDM } from "@/lib/discord"

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const session = await auth()

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Missing queue item ID" }, { status: 400 })
    }

    // Get current item to compare changes
    const { data: currentItem } = await supabase
      .from("queue")
      .select("*")
      .eq("id", id)
      .single()

    // Update the queue item
    const { data: updatedItem, error } = await supabase
      .from("queue")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating queue item:", error)
      return NextResponse.json(
        { error: "Failed to update queue item" },
        { status: 500 }
      )
    }

    // Also update the order status to match queue status
    if (updates.status && updatedItem.order_id) {
      const orderStatusMap: Record<string, string> = {
        new: "in_queue",
        scheduled: "scheduled",
        in_progress: "in_progress",
        review: "review",
        finished: "completed",
      }

      await supabase
        .from("orders")
        .update({ status: orderStatusMap[updates.status] || updates.status })
        .eq("id", updatedItem.order_id)
    }

    // Send Discord DM notifications for relevant changes
    if (updatedItem.discord_id && currentItem) {
      // Appointment scheduled
      if (updates.appointment_time && !currentItem.appointment_time) {
        await sendQueueUpdateDM(updatedItem.discord_id, {
          type: "scheduled",
          packageName: updatedItem.package_name,
          appointmentTime: new Date(updates.appointment_time).toLocaleString(),
        })
      }

      // Room code added
      if (updates.room_code && !currentItem.room_code) {
        await sendQueueUpdateDM(updatedItem.discord_id, {
          type: "room_code",
          packageName: updatedItem.package_name,
          roomCode: updates.room_code,
        })
      }

      // Status changed to in_progress
      if (updates.status === "in_progress" && currentItem.status !== "in_progress") {
        await sendQueueUpdateDM(updatedItem.discord_id, {
          type: "in_progress",
          packageName: updatedItem.package_name,
        })
      }

      // Completed
      if (updates.status === "finished" && currentItem.status !== "finished") {
        await sendQueueUpdateDM(updatedItem.discord_id, {
          type: "completed",
          packageName: updatedItem.package_name,
        })
      }

      // Missed
      if (updates.missed_count && updates.missed_count > (currentItem.missed_count || 0)) {
        await sendQueueUpdateDM(updatedItem.discord_id, {
          type: "missed",
          packageName: updatedItem.package_name,
        })
      }
    }

    return NextResponse.json({ item: updatedItem })
  } catch (error) {
    console.error("Queue update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
