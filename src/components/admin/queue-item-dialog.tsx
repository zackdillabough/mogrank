"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarDays, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AvailabilityDisplay } from "@/components/availability-display"
import { WeekCalendar } from "@/components/admin/week-calendar"
import { SessionsPanel } from "@/components/admin/sessions-panel"
import type { QueueItem, QueueStatus } from "@/lib/types"

interface QueueItemDialogProps {
  item: QueueItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (item: Partial<QueueItem> & { id: string }) => void
}

export function QueueItemDialog({
  item,
  open,
  onOpenChange,
  onUpdate,
}: QueueItemDialogProps) {
  const [appointmentTime, setAppointmentTime] = useState<Date | null>(null)
  const [roomCode, setRoomCode] = useState("")
  const [notes, setNotes] = useState("")
  const [proofAdded, setProofAdded] = useState(false)
  const [status, setStatus] = useState<QueueStatus>("new")
  const [showCalendar, setShowCalendar] = useState(false)
  const [showSessions, setShowSessions] = useState(false)

  // Reset state when dialog opens/closes or item changes
  useEffect(() => {
    if (item && open) {
      if (item.appointment_time) {
        setAppointmentTime(new Date(item.appointment_time))
      } else {
        setAppointmentTime(null)
      }
      setRoomCode(item.room_code || "")
      setNotes(item.notes || "")
      setProofAdded(item.proof_added)
      setStatus(item.status)
      setShowCalendar(false)
      setShowSessions(false)
    }
  }, [item, open])

  if (!item) return null

  const handleSave = () => {
    // Auto-determine status based on inputs
    let newStatus = status
    if (roomCode && !appointmentTime) {
      // If room code but no appointment, set to now and in_progress
      const now = new Date()
      setAppointmentTime(now)
      newStatus = "in_progress"
      onUpdate({
        id: item.id,
        appointment_time: now.toISOString(),
        room_code: roomCode || null,
        notes: notes || null,
        proof_added: proofAdded,
        status: newStatus,
      })
    } else {
      if (appointmentTime && newStatus === "new") {
        newStatus = "scheduled"
      }
      onUpdate({
        id: item.id,
        appointment_time: appointmentTime?.toISOString() || null,
        room_code: roomCode || null,
        notes: notes || null,
        proof_added: proofAdded,
        status: newStatus,
      })
    }
  }

  const handleMarkComplete = () => {
    if (!proofAdded) {
      alert("Please add proof before marking as complete")
      return
    }
    onUpdate({
      id: item.id,
      status: "finished",
      proof_added: true,
    })
  }

  const handleMarkMissed = () => {
    onUpdate({
      id: item.id,
      status: "review",
      missed_count: (item.missed_count || 0) + 1,
    })
  }

  const handleSelectTime = (date: Date) => {
    setAppointmentTime(date)
    setShowCalendar(false)
  }

  const handleClearAppointment = () => {
    setAppointmentTime(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={(showCalendar || showSessions) ? "sm:max-w-[900px] max-h-[90vh] flex flex-col" : "max-w-md"}>
        <DialogHeader>
          <DialogTitle>
            {item.discord_username || "Anonymous"} - {item.package_name}
          </DialogTitle>
        </DialogHeader>

        {showSessions ? (
          // Multi-session view
          <div className="flex-1 overflow-auto py-4">
            <SessionsPanel
              queueId={item.id}
              availability={item.availability || null}
            />
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowSessions(false)}>
                Back to Details
              </Button>
            </div>
          </div>
        ) : showCalendar ? (
          // Calendar view
          <div className="flex-1 overflow-hidden py-4">
            <WeekCalendar
              availability={item.availability || null}
              onSelectTime={handleSelectTime}
              selectedTime={appointmentTime}
              excludeItemId={item.id}
            />
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowCalendar(false)}>
                Back to Details
              </Button>
            </div>
          </div>
        ) : (
          // Details view
          <>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Order ID</Label>
                <div className="col-span-3 font-mono text-sm text-muted-foreground">
                  {item.order_id}
                </div>
              </div>

              {item.availability && Object.keys(item.availability).length > 0 && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-1">Availability</Label>
                  <div className="col-span-3">
                    <AvailabilityDisplay availability={item.availability} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as QueueStatus)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Appointment scheduling */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Appointment</Label>
                <div className="col-span-3">
                  {appointmentTime ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
                        {format(appointmentTime, "EEE, MMM d, yyyy 'at' h:mm a")}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAppointment}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCalendar(true)}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowCalendar(true)}
                      className="w-full justify-start"
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Schedule Appointment
                    </Button>
                  )}
                </div>
              </div>

              {/* Multi-session toggle */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Sessions</Label>
                <div className="col-span-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowSessions(true)}
                    className="w-full justify-start"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Manage Multiple Sessions
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    For orders requiring multiple appointments
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Room Code</Label>
                <Input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="e.g., ABC123"
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes..."
                  className="col-span-3"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Proof</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Checkbox
                    id="proof"
                    checked={proofAdded}
                    onCheckedChange={(checked) => setProofAdded(checked === true)}
                  />
                  <Label htmlFor="proof" className="text-sm font-normal">
                    Proof screenshot added
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {item.status === "in_progress" || item.status === "review" ? (
                <>
                  <Button
                    variant="destructive"
                    onClick={handleMarkMissed}
                    className="sm:mr-auto"
                  >
                    Mark Missed
                  </Button>
                  <Button
                    onClick={handleMarkComplete}
                    disabled={!proofAdded}
                  >
                    Complete Session
                  </Button>
                </>
              ) : null}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
