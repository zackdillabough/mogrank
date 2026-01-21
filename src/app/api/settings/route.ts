import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const session = await auth()

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: settingsData } = await supabase
      .from("settings")
      .select("key, value")

    const settings = (settingsData || []).reduce(
      (acc: Record<string, unknown>, item: { key: string; value: unknown }) => {
        acc[item.key] = item.value
        return acc
      },
      {} as Record<string, unknown>
    )

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Settings fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const session = await auth()

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Update each setting
    for (const [key, value] of Object.entries(body)) {
      await supabase.from("settings").upsert({ key, value })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Settings update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
