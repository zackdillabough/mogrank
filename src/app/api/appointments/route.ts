import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const session = await auth()

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    if (!start || !end) {
      return NextResponse.json(
        { error: "Missing start or end date" },
        { status: 400 }
      )
    }

    // Fetch all queue items with appointments in the date range
    // Join with packages to get estimated_duration
    // Exclude finished items as they no longer occupy time slots
    const { data: appointments, error } = await supabase
      .from("queue")
      .select(`
        id,
        discord_username,
        package_name,
        package_id,
        appointment_time,
        status,
        packages:package_id (
          estimated_duration
        )
      `)
      .not("appointment_time", "is", null)
      .gte("appointment_time", start)
      .lte("appointment_time", end)
      .neq("status", "finished")
      .order("appointment_time", { ascending: true })

    if (error) {
      console.error("Error fetching appointments:", error)
      return NextResponse.json(
        { error: "Failed to fetch appointments" },
        { status: 500 }
      )
    }

    // Transform to flatten the packages join (queue-level appointments)
    const transformedAppointments = appointments?.map((apt) => ({
      id: apt.id,
      discord_username: apt.discord_username,
      package_name: apt.package_name,
      appointment_time: apt.appointment_time,
      status: apt.status,
      source: "queue" as const,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      estimated_duration: (apt.packages as any)?.estimated_duration || 60,
    })) || []

    // Also fetch scheduled sessions from the sessions table
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select(`
        id,
        queue_id,
        appointment_time,
        status,
        queue:queue_id (
          discord_username,
          package_name,
          package_id,
          packages:package_id (
            estimated_duration
          )
        )
      `)
      .not("appointment_time", "is", null)
      .gte("appointment_time", start)
      .lte("appointment_time", end)
      .in("status", ["scheduled", "in_progress"])
      .order("appointment_time", { ascending: true })

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError)
      // Continue with queue appointments only
    }

    // Transform sessions to match appointment format
    const transformedSessions = sessions?.map((sess) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const queue = sess.queue as any
      return {
        id: sess.id,
        queue_id: sess.queue_id,
        discord_username: queue?.discord_username || "Unknown",
        package_name: queue?.package_name || "Unknown",
        appointment_time: sess.appointment_time,
        status: sess.status,
        source: "session" as const,
        estimated_duration: queue?.packages?.estimated_duration || 60,
      }
    }) || []

    // Combine both and sort by appointment time
    const allAppointments = [...transformedAppointments, ...transformedSessions]
      .sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime())

    return NextResponse.json({ appointments: allAppointments })
  } catch (error) {
    console.error("Appointments fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
