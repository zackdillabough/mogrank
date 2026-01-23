"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Package } from "@/lib/types"

interface PackageCardProps {
  package: Package
  isLoggedIn: boolean
}

export function PackageCard({ package: pkg, isLoggedIn }: PackageCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleBuy = async () => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }

    setLoading(true)
    try {
      // Create order
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to create order")
      }

      const { order, walletAddress } = await response.json()

      // Redirect to checkout page
      router.push(`/checkout?orderId=${order.id}&wallet=${walletAddress}`)
    } catch (error) {
      console.error("Error creating order:", error)
      alert("Failed to create order. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{pkg.name}</span>
          <span className="text-2xl font-bold">${pkg.price}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-2">
          <p className="text-3xl font-bold text-primary">
            {pkg.levels.toLocaleString()}
            <span className="text-lg font-normal text-muted-foreground ml-1">levels</span>
          </p>
          <p className="text-sm text-muted-foreground">{pkg.description}</p>
          {pkg.duration_minutes && (
            <p className="text-sm">
              <span className="text-muted-foreground">Duration:</span>{" "}
              <span className="font-medium">~{pkg.duration_minutes} min</span>
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          size="lg"
          onClick={handleBuy}
          disabled={loading}
        >
          {loading ? "Creating Order..." : isLoggedIn ? "Buy Now" : "Login to Buy"}
        </Button>
      </CardFooter>
    </Card>
  )
}
