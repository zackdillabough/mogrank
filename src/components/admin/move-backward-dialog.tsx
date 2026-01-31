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
import { AlertTriangle } from "lucide-react"
import type { QueueItem, QueueStatus } from "@/lib/types"

const STATUS_LABELS: Record<QueueStatus, string> = {
  new: "New",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  review: "Review",
  finished: "Finished",
}

interface MoveBackwardDialogProps {
  item: QueueItem | null
  targetStatus: QueueStatus | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (itemId: string, notes: string | null) => void
  onCancel: () => void
}

export function MoveBackwardDialog({
  item,
  targetStatus,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: MoveBackwardDialogProps) {
  const [reason, setReason] = useState("")

  const handleConfirm = () => {
    if (!item) return
    onConfirm(item.id, reason.trim() || null)
    setReason("")
  }

  const handleCancel = () => {
    setReason("")
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
          <DialogTitle>Move Order Backward</DialogTitle>
          <DialogDescription>
            You&apos;re moving {item?.discord_username || "this order"} from{" "}
            <strong>{item ? STATUS_LABELS[item.status] : ""}</strong> back to{" "}
            <strong>{targetStatus ? STATUS_LABELS[targetStatus] : ""}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-500">Moving backward in the queue</p>
              <p className="text-muted-foreground mt-1">
                This will move the order to an earlier stage. Please provide a reason.
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">Reason for moving backward</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Customer requested reschedule, session issue..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} variant="destructive">
            Move Backward
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
