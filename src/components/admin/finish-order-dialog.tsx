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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"
import type { QueueItem } from "@/lib/types"

interface FinishOrderDialogProps {
  item: QueueItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onFinish: (itemId: string, proofAdded: boolean) => void
  onCancel: () => void
}

export function FinishOrderDialog({
  item,
  open,
  onOpenChange,
  onFinish,
  onCancel,
}: FinishOrderDialogProps) {
  const [proofConfirmed, setProofConfirmed] = useState(false)

  const handleFinish = () => {
    if (!item) return
    onFinish(item.id, proofConfirmed)
    setProofConfirmed(false)
  }

  const handleCancel = () => {
    setProofConfirmed(false)
    onCancel()
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleCancel()
    }
    onOpenChange(newOpen)
  }

  // Check if proof was already added
  const hasExistingProof = item?.proof_added ?? false

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Finish Order</DialogTitle>
          <DialogDescription>
            Mark {item?.discord_username || "this customer"}&apos;s order as complete.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Package</Label>
            <p className="text-sm text-muted-foreground">{item?.package_name}</p>
          </div>

          {!hasExistingProof && !proofConfirmed && (
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-500">Proof not yet added</p>
                <p className="text-muted-foreground mt-1">
                  Please ensure proof of completion has been uploaded before finishing this order.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="proof-confirmed"
              checked={hasExistingProof || proofConfirmed}
              onCheckedChange={(checked) => setProofConfirmed(checked === true)}
              disabled={hasExistingProof}
            />
            <Label
              htmlFor="proof-confirmed"
              className={hasExistingProof ? "text-muted-foreground" : ""}
            >
              {hasExistingProof
                ? "Proof has been added"
                : "I confirm that proof has been added"}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleFinish}
            disabled={!hasExistingProof && !proofConfirmed}
          >
            Finish Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
