"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Plus, CalendarDays, Check, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { WeekCalendar } from "@/components/admin/week-calendar"
import type { Session, SessionStatus, Availability } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SessionsPanelProps {
  queueId: string
  availability: Availability | null
  onSessionChange?: () => void
}

const statusColors: Record<SessionStatus, string> = {
  pending: "bg-gray-100 text-gray-800",
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  missed: "bg-red-100 text-red-800",
}

const statusLabels: Record<SessionStatus, string> = {
  pending: "Pending",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  missed: "Missed",
}

export function SessionsPanel({ queueId, availability, onSessionChange }: SessionsPanelProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [schedulingSessionId, setSchedulingSessionId] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<Date | null>(null)

  const fetchSessions = async () => {
    try {
      const res = await fetch(`/api/sessions?queue_id=${queueId}`)
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [queueId])

  const handleAddSession = async () => {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queue_id: queueId }),
      })
      if (res.ok) {
        fetchSessions()
        onSessionChange?.()
      }
    } catch (error) {
      console.error("Failed to add session:", error)
    }
  }

  const handleUpdateSession = async (sessionId: string, updates: Partial<Session>) => {
    try {
      const res = await fetch("/api/sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId, ...updates }),
      })
      if (res.ok) {
        fetchSessions()
        onSessionChange?.()
      }
    } catch (error) {
      console.error("Failed to update session:", error)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return
    try {
      const res = await fetch(`/api/sessions?id=${sessionId}`, { method: "DELETE" })
      if (res.ok) {
        fetchSessions()
        onSessionChange?.()
      }
    } catch (error) {
      console.error("Failed to delete session:", error)
    }
  }

  const handleScheduleSession = (sessionId: string) => {
    setSchedulingSessionId(sessionId)
    setSelectedTime(null)
  }

  const handleConfirmSchedule = async () => {
    if (!schedulingSessionId || !selectedTime) return
    await handleUpdateSession(schedulingSessionId, {
      appointment_time: selectedTime.toISOString(),
      status: "scheduled",
    })
    setSchedulingSessionId(null)
    setSelectedTime(null)
  }

  const handleCancelSchedule = () => {
    setSchedulingSessionId(null)
    setSelectedTime(null)
  }

  const handleMarkComplete = async (sessionId: string) => {
    await handleUpdateSession(sessionId, { status: "completed", proof_added: true })
  }

  const handleMarkMissed = async (sessionId: string) => {
    await handleUpdateSession(sessionId, { status: "missed", missed: true })
  }

  const handleStartSession = async (sessionId: string, roomCode?: string) => {
    await handleUpdateSession(sessionId, {
      status: "in_progress",
      room_code: roomCode || null,
      appointment_time: new Date().toISOString(),
    })
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading sessions...</div>
  }

  // If scheduling a session, show the calendar
  if (schedulingSessionId) {
    const session = sessions.find((s) => s.id === schedulingSessionId)
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Schedule Session #{session?.session_number}</h4>
          <Button variant="ghost" size="sm" onClick={handleCancelSchedule}>
            Cancel
          </Button>
        </div>
        <WeekCalendar
          availability={availability}
          onSelectTime={setSelectedTime}
          selectedTime={selectedTime}
        />
        {selectedTime && (
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-md">
            <div>
              <p className="text-sm font-medium">Selected Time</p>
              <p className="text-lg text-primary">
                {format(selectedTime, "EEE, MMM d 'at' h:mm a")}
              </p>
            </div>
            <Button onClick={handleConfirmSchedule}>Confirm</Button>
          </div>
        )}
      </div>
    )
  }

  const completedCount = sessions.filter((s) => s.status === "completed").length
  const totalCount = sessions.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Sessions</h4>
          {totalCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {completedCount} of {totalCount} completed
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleAddSession}>
          <Plus className="h-4 w-4 mr-1" />
          Add Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground border border-dashed rounded-md">
          <p className="text-sm">No sessions scheduled</p>
          <p className="text-xs">Add sessions to track multiple appointments for this order</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onSchedule={() => handleScheduleSession(session.id)}
              onStart={(roomCode) => handleStartSession(session.id, roomCode)}
              onComplete={() => handleMarkComplete(session.id)}
              onMissed={() => handleMarkMissed(session.id)}
              onDelete={() => handleDeleteSession(session.id)}
              onUpdate={(updates) => handleUpdateSession(session.id, updates)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface SessionCardProps {
  session: Session
  onSchedule: () => void
  onStart: (roomCode?: string) => void
  onComplete: () => void
  onMissed: () => void
  onDelete: () => void
  onUpdate: (updates: Partial<Session>) => void
}

function SessionCard({
  session,
  onSchedule,
  onStart,
  onComplete,
  onMissed,
  onDelete,
  onUpdate,
}: SessionCardProps) {
  const [roomCode, setRoomCode] = useState(session.room_code || "")
  const [showRoomInput, setShowRoomInput] = useState(false)

  const handleStartWithRoom = () => {
    onStart(roomCode)
    setShowRoomInput(false)
  }

  return (
    <div className={cn(
      "border rounded-md p-3 space-y-2",
      session.status === "completed" && "bg-green-50 border-green-200",
      session.status === "missed" && "bg-red-50 border-red-200"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">Session #{session.session_number}</span>
          <Badge className={cn("text-xs", statusColors[session.status])}>
            {statusLabels[session.status]}
          </Badge>
        </div>
        {session.status === "pending" && (
          <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {session.appointment_time && (
        <p className="text-sm text-muted-foreground">
          {format(new Date(session.appointment_time), "EEE, MMM d 'at' h:mm a")}
        </p>
      )}

      {session.room_code && session.status === "in_progress" && (
        <p className="text-sm">
          Room: <span className="font-mono">{session.room_code}</span>
        </p>
      )}

      {/* Actions based on status */}
      <div className="flex flex-wrap gap-2">
        {session.status === "pending" && (
          <Button variant="outline" size="sm" onClick={onSchedule}>
            <CalendarDays className="h-4 w-4 mr-1" />
            Schedule
          </Button>
        )}

        {session.status === "scheduled" && (
          <>
            <Button variant="outline" size="sm" onClick={onSchedule}>
              Reschedule
            </Button>
            {showRoomInput ? (
              <div className="flex items-center gap-2">
                <Input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="Room code"
                  className="h-8 w-24"
                />
                <Button size="sm" onClick={handleStartWithRoom}>
                  Start
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowRoomInput(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setShowRoomInput(true)}>
                Start Session
              </Button>
            )}
          </>
        )}

        {session.status === "in_progress" && (
          <>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`proof-${session.id}`}
                checked={session.proof_added}
                onCheckedChange={(checked) => onUpdate({ proof_added: checked === true })}
              />
              <Label htmlFor={`proof-${session.id}`} className="text-xs">
                Proof added
              </Label>
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={onComplete}
              disabled={!session.proof_added}
            >
              <Check className="h-4 w-4 mr-1" />
              Complete
            </Button>
            <Button size="sm" variant="destructive" onClick={onMissed}>
              <X className="h-4 w-4 mr-1" />
              Missed
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
