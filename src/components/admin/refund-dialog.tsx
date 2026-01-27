"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { Order } from "@/lib/types"

interface RefundDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefunded: () => void
}

export function RefundDialog({ order, open, onOpenChange, onRefunded }: RefundDialogProps) {
  const [deductFees, setDeductFees] = useState(true)
  const [confirmation, setConfirmation] = useState("")
  const [loading, setLoading] = useState(false)

  if (!order) return null

  const orderAmount = Number(order.amount)
  const stripeFee = orderAmount * 0.029 + 0.30
  const refundAmount = deductFees ? Math.max(0, orderAmount - stripeFee) : orderAmount

  const isConfirmed = confirmation.toUpperCase() === "REFUND"

  const handleRefund = async () => {
    if (!isConfirmed) return

    setLoading(true)
    try {
      const response = await fetch(`/api/orders/${order.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deductFees }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to process refund")
      }

      onRefunded()
      onOpenChange(false)
      setConfirmation("")
      setDeductFees(true)
    } catch (error) {
      console.error("Refund error:", error)
      alert(error instanceof Error ? error.message : "Failed to process refund")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val)
      if (!val) {
        setConfirmation("")
        setDeductFees(true)
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refund Order</DialogTitle>
          <DialogDescription>
            Refund {order.discord_username}&apos;s order for {order.package_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order Amount</span>
            <span className="font-medium">${orderAmount.toFixed(2)}</span>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="deductFees"
              checked={deductFees}
              onCheckedChange={(checked) => setDeductFees(checked === true)}
            />
            <div className="grid gap-1 leading-none">
              <Label htmlFor="deductFees" className="text-sm font-normal">
                Deduct Stripe processing fees (~2.9% + $0.30)
              </Label>
              <p className="text-xs text-muted-foreground">
                Fee: ${stripeFee.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex justify-between text-sm border-t pt-3">
            <span className="font-medium">Refund Amount</span>
            <span className="font-bold text-lg">${refundAmount.toFixed(2)}</span>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="confirmation" className="text-sm">
              Type <span className="font-mono font-bold">REFUND</span> to confirm
            </Label>
            <Input
              id="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="Type REFUND"
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRefund}
            disabled={!isConfirmed || loading}
          >
            {loading ? "Processing..." : "Process Refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
