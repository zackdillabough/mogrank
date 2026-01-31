"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AvailabilityGrid, normalizeAvailability } from "@/components/availability-grid"
import type { Package, Availability } from "@/lib/types"

const rotations = ["-2deg", "1.5deg", "-1deg", "2deg", "-0.5deg", "1deg"]

interface PackageCardProps {
  package: Package
  index?: number
  isLoggedIn: boolean
}

export function PackageCard({ package: pkg, index = 0, isLoggedIn }: PackageCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [cardRect, setCardRect] = useState<DOMRect | null>(null)
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false)
  const [availability, setAvailability] = useState<Availability>({})
  const [inCopyMode, setInCopyMode] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const rotation = rotations[index % rotations.length]

  const handleExpand = () => {
    if (cardRef.current) {
      setCardRect(cardRef.current.getBoundingClientRect())
    }
    setExpanded(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimating(true)
      })
    })
  }

  const handleCollapse = useCallback(() => {
    if (cardRef.current) {
      setCardRect(cardRef.current.getBoundingClientRect())
    }
    setAnimating(false)
    setTimeout(() => {
      setExpanded(false)
    }, 350)
  }, [])

  useEffect(() => {
    if (!expanded) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCollapse()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [expanded, handleCollapse])

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    // Open availability dialog instead of going directly to checkout
    setAvailabilityDialogOpen(true)
  }

  const handleCheckout = async () => {
    // Validate at least some availability is selected
    const hasAvailability = Object.values(availability).some((hours) => hours && hours.length > 0)
    if (!hasAvailability) {
      alert("Please select at least one time slot when you're available.")
      return
    }

    // Normalize availability (sort and merge overlapping ranges) before checkout
    const normalizedAvailability = normalizeAvailability(availability)

    setLoading(true)
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, availability: normalizedAvailability }),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error("Error starting checkout:", error)
      alert("Failed to start checkout. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Calculate the transform to go from card position to center
  const getExpandedStyle = (): React.CSSProperties => {
    if (!cardRect) return {}

    const viewportW = window.innerWidth
    const viewportH = window.innerHeight
    const targetW = Math.min(360, viewportW - 48)
    const scale = targetW / cardRect.width
    const centerX = viewportW / 2 - cardRect.left - cardRect.width / 2
    const centerY = viewportH / 2 - cardRect.top - cardRect.height / 2

    if (animating) {
      return {
        position: "fixed",
        top: cardRect.top,
        left: cardRect.left,
        width: cardRect.width,
        height: cardRect.height,
        zIndex: 50,
        transform: `translate(${centerX}px, ${centerY}px) scale(${scale}) rotate(0deg)`,
        transition: "transform 350ms cubic-bezier(0.4, 0, 0.2, 1)",
      }
    }

    return {
      position: "fixed",
      top: cardRect.top,
      left: cardRect.left,
      width: cardRect.width,
      height: cardRect.height,
      zIndex: 50,
      transform: `rotate(${rotation})`,
      transition: "transform 350ms cubic-bezier(0.4, 0, 0.2, 1)",
    }
  }

  return (
    <>
      {/* Card in grid */}
      <div
        ref={cardRef}
        className="group transition-transform hover:scale-105 hover:rotate-0 cursor-pointer"
        style={{ rotate: rotation, visibility: expanded ? "hidden" : "visible" }}
        onClick={handleExpand}
      >
        <PolaroidFrame pkg={pkg} />
        <p className="text-sm text-center text-muted-foreground mt-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
          Click to learn more
        </p>
      </div>

      {/* Expanded overlay */}
      {expanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 transition-opacity duration-350"
            style={{ opacity: animating ? 1 : 0 }}
            onClick={handleCollapse}
          />

          {/* Animated card */}
          <div style={getExpandedStyle()} onClick={handleCollapse}>
            <PolaroidFrame pkg={pkg} expanded={animating} />
            {/* Buy button (fade in) */}
            <div
              className="mt-3 transition-opacity duration-200"
              style={{ opacity: animating ? 1 : 0, transitionDelay: animating ? "200ms" : "0ms" }}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                className="w-full"
                size="lg"
                onClick={handleBuyClick}
                disabled={loading}
              >
                {isLoggedIn ? "Buy Now" : "Login to Buy"}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Availability selection dialog */}
      <Dialog open={availabilityDialogOpen} onOpenChange={setAvailabilityDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Your Availability</DialogTitle>
            <DialogDescription>
              Choose the times when you&apos;re available for your {pkg.name} session.
              We&apos;ll schedule your appointment based on these times.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 -mx-6 px-6">
            <AvailabilityGrid
              value={availability}
              onChange={setAvailability}
              onCopyModeChange={setInCopyMode}
            />
          </div>

          {!inCopyMode && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setAvailabilityDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCheckout} disabled={loading}>
                {loading ? "Processing..." : "Continue to Payment"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function PolaroidFrame({ pkg, expanded = false }: { pkg: Package; expanded?: boolean }) {
  return (
    <div className="bg-white dark:bg-zinc-100 p-3 pb-14 shadow-lg relative">
      <div className="aspect-square bg-zinc-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {pkg.image_url && (
          <img
            src={pkg.image_url}
            alt={pkg.name}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        {/* Dark radial gradient for text readability */}
        <div className="absolute inset-0 bg-radial-[at_center] from-black/60 via-black/30 to-transparent" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <p className="text-5xl font-bold text-white drop-shadow-lg">
            {pkg.header}
          </p>
          <p className="text-base text-zinc-300 mt-1">{pkg.subtitle}</p>
          {pkg.description && (
            <div
              className="overflow-hidden transition-all duration-300 ease-out"
              style={{
                maxHeight: expanded ? "80px" : "0px",
                opacity: expanded ? 1 : 0,
                marginTop: expanded ? "12px" : "0px",
              }}
            >
              <p className="text-xs text-zinc-300 max-w-[180px] leading-relaxed">{pkg.description}</p>
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 font-[family-name:var(--font-permanent-marker)]">
        <p className="text-zinc-800 text-lg truncate">{pkg.name}</p>
        <p className="text-zinc-800 text-lg shrink-0">$ {Number(pkg.price).toFixed(2)}</p>
      </div>
    </div>
  )
}
