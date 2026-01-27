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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DiscountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function DiscountDialog({ open, onOpenChange, onCreated }: DiscountDialogProps) {
  const [code, setCode] = useState("")
  const [type, setType] = useState<"percent" | "fixed">("percent")
  const [amount, setAmount] = useState("")
  const [maxRedemptions, setMaxRedemptions] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!amount) return

    setLoading(true)
    try {
      const response = await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code || undefined,
          type,
          amount: Number(amount),
          maxRedemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
          expiresAt: expiresAt || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create discount")
      }

      onCreated()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error creating discount:", error)
      alert(error instanceof Error ? error.message : "Failed to create discount")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCode("")
    setType("percent")
    setAmount("")
    setMaxRedemptions("")
    setExpiresAt("")
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val)
      if (!val) resetForm()
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Discount Code</DialogTitle>
          <DialogDescription>
            Create a promotion code for Stripe Checkout
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code (optional — auto-generates if blank)</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. TESTFREE"
              className="font-mono uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "percent" | "fixed")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage off</SelectItem>
                  <SelectItem value="fixed">Fixed amount off</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                {type === "percent" ? "Percent (1-100)" : "Amount ($)"}
              </Label>
              <Input
                id="amount"
                type="number"
                min={type === "percent" ? 1 : 0.01}
                max={type === "percent" ? 100 : undefined}
                step={type === "percent" ? 1 : 0.01}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={type === "percent" ? "100" : "5.00"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxRedemptions">Max Redemptions (optional)</Label>
              <Input
                id="maxRedemptions"
                type="number"
                min={1}
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                placeholder="Unlimited"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expires (optional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!amount || loading}>
            {loading ? "Creating..." : "Create Code"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
