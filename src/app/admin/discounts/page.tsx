"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DiscountDialog } from "@/components/admin/discount-dialog"

interface DiscountCode {
  id: string
  code: string
  coupon_id: string
  type: "percent" | "fixed"
  amount: number
  times_redeemed: number
  max_redemptions: number | null
  active: boolean
  expires_at: string | null
  created: string
}

export default function DiscountsPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchCodes = async () => {
    try {
      const response = await fetch("/api/discounts")
      const data = await response.json()
      setCodes(data.codes || [])
    } catch (error) {
      console.error("Error fetching codes:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCodes()
  }, [])

  const handleDeactivate = async (id: string) => {
    if (!confirm("Deactivate this discount code?")) return

    try {
      const response = await fetch(`/api/discounts?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to deactivate")
      }

      fetchCodes()
    } catch (error) {
      console.error("Error deactivating code:", error)
      alert("Failed to deactivate discount code")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading discount codes...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Discount Codes</h1>
        <Button onClick={() => setDialogOpen(true)}>Create Discount</Button>
      </div>

      {codes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No discount codes yet. Create one to get started.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Max Uses</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.map((code) => (
              <TableRow key={code.id}>
                <TableCell className="font-mono font-medium">
                  {code.code}
                </TableCell>
                <TableCell>
                  {code.type === "percent"
                    ? `${code.amount}% off`
                    : `$${code.amount.toFixed(2)} off`}
                </TableCell>
                <TableCell>{code.times_redeemed}</TableCell>
                <TableCell>
                  {code.max_redemptions || "Unlimited"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {code.expires_at
                    ? format(new Date(code.expires_at), "MMM d, yyyy")
                    : "Never"}
                </TableCell>
                <TableCell>
                  <Badge className={code.active
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  }>
                    {code.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {code.active && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeactivate(code.id)}
                    >
                      Deactivate
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <DiscountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={fetchCodes}
      />
    </div>
  )
}
