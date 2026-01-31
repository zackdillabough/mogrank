"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { QueueItem } from "@/lib/types"

interface CompleteSessionDialogProps {
  item: QueueItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (itemId: string, notes: string | null) => void
  onCancel: () => void
}

export function CompleteSessionDialog({
  item,
  open,
  onOpenChange,
  onComplete,
  onCancel,
}: CompleteSessionDialogProps) {
  const [notes, setNotes] = useState("")

  const handleComplete = () => {
    if (!item) return
    onComplete(item.id, notes.trim() || null)
    setNotes("")
  }

  const handleCancel = () => {
    setNotes("")
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
          <DialogTitle>Complete Session</DialogTitle>
          <DialogDescription>
            Mark {item?.discord_username || "this customer"}&apos;s session as complete and ready for review.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Package</Label>
            <p className="text-sm text-muted-foreground">{item?.package_name}</p>
          </div>

          {item?.room_code && (
            <div className="grid gap-2">
              <Label>Room Code</Label>
              <p className="text-sm font-mono">{item.room_code}</p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes">Session Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any notes about the session..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleComplete}>
            Move to Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
