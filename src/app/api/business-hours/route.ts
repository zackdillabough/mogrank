import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { DEFAULT_BUSINESS_HOURS } from "@/lib/types"

// Public endpoint - no auth required
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["business_hours", "max_concurrent_sessions"])

    const businessHours = data?.find((s) => s.key === "business_hours")?.value ?? DEFAULT_BUSINESS_HOURS
    const maxConcurrentSessions = data?.find((s) => s.key === "max_concurrent_sessions")?.value?.count ?? 3

    return NextResponse.json({ businessHours, maxConcurrentSessions })
  } catch (error) {
    console.error("Business hours fetch error:", error)
    // Return defaults on error
    return NextResponse.json({ businessHours: DEFAULT_BUSINESS_HOURS, maxConcurrentSessions: 3 })
  }
}
