"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { QueueItem } from "@/lib/types"

interface StartSessionDialogProps {
  item: QueueItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStart: (itemId: string, appointmentTime: string, roomCode: string) => void
  onCancel: () => void
}

export function StartSessionDialog({
  item,
  open,
  onOpenChange,
  onStart,
  onCancel,
}: StartSessionDialogProps) {
  const [roomCode, setRoomCode] = useState("")
  const [appointmentTime, setAppointmentTime] = useState("")

  // Set default appointment time to now when dialog opens
  useEffect(() => {
    if (open) {
      const now = new Date()
      setAppointmentTime(now.toISOString().slice(0, 16)) // Format: YYYY-MM-DDTHH:mm
      setRoomCode("")
    }
  }, [open])

  const handleStart = () => {
    if (!item || !roomCode.trim()) return

    // Convert local datetime to ISO string
    const appointmentDate = new Date(appointmentTime)
    onStart(item.id, appointmentDate.toISOString(), roomCode.trim().toUpperCase())

    // Reset state
    setRoomCode("")
    setAppointmentTime("")
  }

  const handleCancel = () => {
    setRoomCode("")
    setAppointmentTime("")
    onCancel()
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleCancel()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start Session</DialogTitle>
          <DialogDescription>
            Enter the room code to start {item?.discord_username || "this customer"}&apos;s session.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Package</Label>
            <p className="text-sm text-muted-foreground">{item?.package_name}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="appointment-time">Start Time</Label>
            <Input
              id="appointment-time"
              type="datetime-local"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="room-code">Room Code</Label>
            <Input
              id="room-code"
              placeholder="e.g., ABC123"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="font-mono uppercase"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={!roomCode.trim()}>
            Start Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
