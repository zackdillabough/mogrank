"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
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
  const [appointmentDate, setAppointmentDate] = useState("")
  const [appointmentTime, setAppointmentTime] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [notes, setNotes] = useState("")
  const [proofAdded, setProofAdded] = useState(false)
  const [status, setStatus] = useState<QueueStatus>("new")

  useEffect(() => {
    if (item) {
      if (item.appointment_time) {
        const date = new Date(item.appointment_time)
        setAppointmentDate(format(date, "yyyy-MM-dd"))
        setAppointmentTime(format(date, "HH:mm"))
      } else {
        setAppointmentDate("")
        setAppointmentTime("")
      }
      setRoomCode(item.room_code || "")
      setNotes(item.notes || "")
      setProofAdded(item.proof_added)
      setStatus(item.status)
    }
  }, [item])

  if (!item) return null

  const handleSave = () => {
    let appointmentDateTime: string | null = null
    if (appointmentDate && appointmentTime) {
      appointmentDateTime = new Date(
        `${appointmentDate}T${appointmentTime}`
      ).toISOString()
    }

    // Auto-determine status based on inputs
    let newStatus = status
    if (roomCode && !appointmentDateTime) {
      appointmentDateTime = new Date().toISOString()
      newStatus = "in_progress"
    } else if (appointmentDateTime && newStatus === "new") {
      newStatus = "scheduled"
    }

    onUpdate({
      id: item.id,
      appointment_time: appointmentDateTime,
      room_code: roomCode || null,
      notes: notes || null,
      proof_added: proofAdded,
      status: newStatus,
    })
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

  const handleSetNow = () => {
    const now = new Date()
    setAppointmentDate(format(now, "yyyy-MM-dd"))
    setAppointmentTime(format(now, "HH:mm"))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {item.discord_username || "Anonymous"} - {item.package_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Order ID</Label>
            <div className="col-span-3 font-mono text-sm text-muted-foreground">
              {item.order_id}
            </div>
          </div>

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

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Date</Label>
            <div className="col-span-3 flex gap-2">
              <Input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={handleSetNow}>
                Now
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Time</Label>
            <Input
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="col-span-3"
            />
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
      </DialogContent>
    </Dialog>
  )
}
