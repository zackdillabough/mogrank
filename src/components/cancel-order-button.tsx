"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"

interface CancelOrderButtonProps {
  orderId: string
  orderAmount: number
  canCancel: boolean
}

export function CancelOrderButton({ orderId, orderAmount, canCancel }: CancelOrderButtonProps) {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState("")
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate estimated refund (minus Stripe fees)
  const stripeFee = orderAmount * 0.029 + 0.30
  const estimatedRefund = Math.max(0, orderAmount - stripeFee)

  const handleCancel = async () => {
    if (confirmation !== "CANCEL") return

    setCancelling(true)
    setError(null)

    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to cancel order")
      }

      // Success - refresh page to show updated status
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel order")
      setCancelling(false)
    }
  }

  if (!canCancel) {
    return (
      <p className="text-sm text-muted-foreground">
        Orders in progress cannot be cancelled. Contact support if you need assistance.
      </p>
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Cancel Order
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>

              <div className="bg-muted rounded-lg p-3 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Original amount:</span> ${orderAmount.toFixed(2)}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Processing fee:</span> -${stripeFee.toFixed(2)}
                </p>
                <p className="text-sm font-medium border-t pt-1 mt-1">
                  Refund amount: ${estimatedRefund.toFixed(2)}
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                Processing fees are non-refundable per our terms of service. Refunds typically arrive within 5-10 business days.
              </p>

              <div className="pt-2">
                <p className="text-sm mb-2">
                  Type <span className="font-mono font-bold">CANCEL</span> to confirm:
                </p>
                <Input
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="Type CANCEL"
                  className="font-mono"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmation("")}>
            Keep Order
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={confirmation !== "CANCEL" || cancelling}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
