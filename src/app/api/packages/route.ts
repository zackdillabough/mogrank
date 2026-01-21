import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data: packages, error } = await supabase
      .from("packages")
      .select("*")
      .eq("active", true)
      .order("price", { ascending: true })

    if (error) {
      console.error("Error fetching packages:", error)
      return NextResponse.json(
        { error: "Failed to fetch packages" },
        { status: 500 }
      )
    }

    return NextResponse.json({ packages })
  } catch (error) {
    console.error("Packages fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
