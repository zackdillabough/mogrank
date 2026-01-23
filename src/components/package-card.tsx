"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import type { Package } from "@/lib/types"

const rotations = ["-2deg", "1.5deg", "-1deg", "2deg", "-0.5deg", "1deg"]

interface PackageCardProps {
  package: Package
  index?: number
  isLoggedIn: boolean
}

export function PackageCard({ package: pkg, index = 0, isLoggedIn }: PackageCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const rotation = rotations[index % rotations.length]

  const handleBuy = async () => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to create order")
      }

      const { order, walletAddress } = await response.json()
      router.push(`/checkout?orderId=${order.id}&wallet=${walletAddress}`)
    } catch (error) {
      console.error("Error creating order:", error)
      alert("Failed to create order. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="group transition-transform hover:scale-105 hover:rotate-0 cursor-pointer"
      style={{ rotate: rotation }}
    >
      {/* Polaroid frame */}
      <div className="bg-white dark:bg-zinc-100 p-3 pb-14 shadow-lg relative">
        {/* Photo area */}
        <div className="aspect-square bg-zinc-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {pkg.image_url && (
            <img
              src={pkg.image_url}
              alt={pkg.name}
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}
          <div className="relative z-10 flex flex-col items-center">
            <p className="text-4xl font-bold text-white">
              {pkg.levels.toLocaleString()}
            </p>
            <p className="text-sm text-zinc-400 mt-1">levels</p>
            {pkg.duration_minutes && (
              <p className="text-xs text-zinc-500 mt-2">~{pkg.duration_minutes} min</p>
            )}
            <p className="text-lg font-bold text-white mt-3">${pkg.price}</p>
          </div>
        </div>

        {/* Caption area - like the map names in Phasmophobia */}
        <p className="absolute bottom-4 left-0 right-0 text-center text-zinc-800 font-handwriting text-lg font-medium italic">
          {pkg.name}
        </p>
      </div>

      {/* Buy button appears on hover */}
      <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          className="w-full"
          size="sm"
          onClick={handleBuy}
          disabled={loading}
        >
          {loading ? "Creating Order..." : isLoggedIn ? "Buy Now" : "Login to Buy"}
        </Button>
      </div>
    </div>
  )
}
