import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

// Get orders (for dashboard)
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const all = searchParams.get("all") === "true"

    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })

    // If not admin or not requesting all, filter by user
    if (!session.user.isAdmin || !all) {
      query = query.eq("discord_id", session.user.discordId)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error("Error fetching orders:", error)
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      )
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Orders fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
