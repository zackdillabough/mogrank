"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RampWidget } from "@/components/ramp-widget"
import Link from "next/link"

interface Order {
  id: string
  package_name: string
  amount: number
  status: string
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const walletAddress = searchParams.get("wallet")

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided")
      setLoading(false)
      return
    }

    // Fetch order details
    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setOrder(data.order)
        }
      })
      .catch(() => setError("Failed to load order"))
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading order...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error || "Order not found"}</p>
            <Link href="/" className="text-primary hover:underline">
              Back to home
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (order.status !== "pending_payment") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="mb-4">This order has already been processed.</p>
            <Link href="/dashboard" className="text-primary hover:underline">
              View your dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mb-2 inline-block">
            <img src="/mogrank_wordmark.svg" alt="mogrank" className="h-8" />
          </Link>
          <CardTitle>Complete Your Purchase</CardTitle>
        </CardHeader>
        <CardContent>
          <RampWidget
            orderId={order.id}
            packageName={order.package_name}
            amount={order.amount}
            walletAddress={walletAddress || ""}
            onSuccess={() => {
              window.location.href = `/checkout/success?orderId=${order.id}`
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
