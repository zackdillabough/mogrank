import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { sendQueueUpdateDM } from "@/lib/discord"

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) return true // Skip in development
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    let movedCount = 0

    // 1. Move scheduled items to in_progress if appointment time has passed
    const { data: scheduledItems, error: scheduledError } = await supabase
      .from("queue")
      .select("*")
      .eq("status", "scheduled")
      .lte("appointment_time", now.toISOString())

    if (!scheduledError && scheduledItems) {
      for (const item of scheduledItems) {
        await supabase
          .from("queue")
          .update({ status: "in_progress" })
          .eq("id", item.id)

        // Also update order status
        if (item.order_id) {
          await supabase
            .from("orders")
            .update({ status: "in_progress" })
            .eq("id", item.order_id)
        }

        // Notify user
        if (item.discord_id) {
          await sendQueueUpdateDM(item.discord_id, {
            type: "in_progress",
            packageName: item.package_name,
          })
        }

        movedCount++
      }
    }

    // 2. Move in_progress items to review if time > appointment + 1 hour
    const { data: inProgressItems, error: inProgressError } = await supabase
      .from("queue")
      .select("*")
      .eq("status", "in_progress")
      .lte("appointment_time", oneHourAgo.toISOString())

    if (!inProgressError && inProgressItems) {
      for (const item of inProgressItems) {
        // Only move if proof not added yet
        if (!item.proof_added) {
          await supabase
            .from("queue")
            .update({ status: "review" })
            .eq("id", item.id)

          // Update order status
          if (item.order_id) {
            await supabase
              .from("orders")
              .update({ status: "review" })
              .eq("id", item.order_id)
          }

          movedCount++
        }
      }
    }

    // 3. Archive old finished items (older than 7 days by default)
    const { data: settings } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "auto_archive_days")
      .single()

    const archiveDays = settings?.value?.days || 7
    const archiveDate = new Date(now.getTime() - archiveDays * 24 * 60 * 60 * 1000)

    // Delete old finished queue items
    await supabase
      .from("queue")
      .delete()
      .eq("status", "finished")
      .lte("updated_at", archiveDate.toISOString())

    console.log(`Cron job completed. Moved ${movedCount} items.`)

    return NextResponse.json({
      success: true,
      movedCount,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
