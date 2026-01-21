"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

interface RampWidgetProps {
  orderId: string
  packageName: string
  amount: number
  walletAddress: string
  onSuccess?: () => void
  onClose?: () => void
}

declare global {
  interface Window {
    RampInstantSDK: new (config: RampConfig) => RampInstance
  }
}

interface RampConfig {
  hostAppName: string
  hostLogoUrl: string
  swapAsset: string
  userAddress: string
  fiatValue: number
  fiatCurrency: string
  webhookStatusUrl: string
  finalUrl: string
  hostApiKey?: string
}

interface RampInstance {
  show: () => RampInstance
  on: (event: string, callback: (event: RampEvent) => void) => RampInstance
}

interface RampEvent {
  type: string
  payload?: {
    purchase?: {
      id: string
      status: string
    }
  }
}

export function RampWidget({
  orderId,
  packageName,
  amount,
  walletAddress,
  onSuccess,
  onClose,
}: RampWidgetProps) {
  const widgetRef = useRef<RampInstance | null>(null)

  useEffect(() => {
    // Load Ramp SDK script
    const script = document.createElement("script")
    script.src = "https://cdn.ramp.network/sdk.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const openRampWidget = () => {
    if (!window.RampInstantSDK) {
      console.error("Ramp SDK not loaded")
      return
    }

    const widget = new window.RampInstantSDK({
      hostAppName: "mogrank",
      hostLogoUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/logo.png`,
      swapAsset: "SOLANA_USDC", // USDC on Solana - stable value, low fees
      userAddress: walletAddress,
      fiatValue: amount,
      fiatCurrency: "USD",
      webhookStatusUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/ramp-webhook`,
      finalUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/checkout/success?orderId=${orderId}`,
    })

    widget
      .on("PURCHASE_CREATED", (event: RampEvent) => {
        console.log("Purchase created:", event)
        // Store the Ramp purchase ID with our order
        fetch("/api/orders/link-ramp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            rampOrderId: event.payload?.purchase?.id,
          }),
        })
      })
      .on("PURCHASE_SUCCESSFUL", () => {
        console.log("Purchase successful")
        onSuccess?.()
      })
      .on("WIDGET_CLOSE", () => {
        console.log("Widget closed")
        onClose?.()
      })
      .show()

    widgetRef.current = widget
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border p-4 bg-muted/50">
        <h3 className="font-semibold mb-2">Order Summary</h3>
        <div className="flex justify-between text-sm">
          <span>Package:</span>
          <span className="font-medium">{packageName}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span>Total:</span>
          <span className="font-medium">${amount.toFixed(2)}</span>
        </div>
      </div>

      <Button onClick={openRampWidget} size="lg" className="w-full">
        Pay with Card / Apple Pay
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Powered by Ramp Network. No crypto wallet required.
      </p>
    </div>
  )
}
