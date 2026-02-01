"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, CheckCircle } from "lucide-react"
import type { BusinessHours, DayOfWeek } from "@/lib/types"
import { DEFAULT_BUSINESS_HOURS } from "@/lib/types"

interface PendingCheckout {
  id: string
  stripe_session_id: string
  discord_id: string
  discord_username: string
  package_id: string
  package_name: string
  created_at: string
}

const DAYS: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]

const DAY_LABELS: Record<DayOfWeek, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
}

interface Settings {
  proofRequired: boolean
  autoArchiveDays: number
  businessHours: BusinessHours
  maxConcurrentSessions: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    proofRequired: true,
    autoArchiveDays: 7,
    businessHours: DEFAULT_BUSINESS_HOURS,
    maxConcurrentSessions: 3,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pendingCheckouts, setPendingCheckouts] = useState<PendingCheckout[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    // Fetch settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings({
            proofRequired: data.settings.proof_required?.enabled ?? true,
            autoArchiveDays: data.settings.auto_archive_days?.days ?? 7,
            businessHours: data.settings.business_hours ?? DEFAULT_BUSINESS_HOURS,
            maxConcurrentSessions: data.settings.max_concurrent_sessions?.count ?? 3,
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    // Fetch pending checkouts (test mode only)
    if (process.env.NEXT_PUBLIC_STRIPE_MODE === "test") {
      fetch("/api/admin/process-pending")
        .then((res) => res.json())
        .then((data) => {
          if (data.pendingCheckouts) {
            setPendingCheckouts(data.pendingCheckouts)
          }
        })
        .catch(console.error)
    }
  }, [])

  const handleProcessPending = async (checkoutId: string, amount: number) => {
    setProcessingId(checkoutId)
    try {
      const res = await fetch("/api/admin/process-pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pending_checkout_id: checkoutId, amount }),
      })
      const data = await res.json()
      if (res.ok) {
        alert(`Order created successfully! Order ID: ${data.order?.id}`)
        setPendingCheckouts((prev) => prev.filter((p) => p.id !== checkoutId))
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error processing pending checkout:", error)
      alert("Failed to process pending checkout")
    } finally {
      setProcessingId(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof_required: { enabled: settings.proofRequired },
          auto_archive_days: { days: settings.autoArchiveDays },
          business_hours: settings.businessHours,
          max_concurrent_sessions: { count: settings.maxConcurrentSessions },
        }),
      })
      alert("Settings saved!")
    } catch (error) {
      console.error("Failed to save settings:", error)
      alert("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const updateDayHours = (day: DayOfWeek, field: "enabled" | "start" | "end", value: boolean | string) => {
    setSettings((s) => ({
      ...s,
      businessHours: {
        ...s.businessHours,
        [day]: {
          ...s.businessHours[day],
          [field]: value,
        },
      },
    }))
  }

  const copyToAllDays = (sourceDay: DayOfWeek) => {
    const source = settings.businessHours[sourceDay]
    setSettings((s) => ({
      ...s,
      businessHours: DAYS.reduce((acc, day) => {
        acc[day] = { ...source }
        return acc
      }, {} as BusinessHours),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Business Hours</CardTitle>
          <CardDescription>
            Set your availability for each day of the week. These hours will be shown to customers and used for scheduling.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day) => {
            const hours = settings.businessHours[day]
            return (
              <div key={day} className="flex items-center gap-4">
                <div className="w-28 flex items-center gap-2">
                  <Switch
                    checked={hours.enabled}
                    onCheckedChange={(checked) => updateDayHours(day, "enabled", checked)}
                  />
                  <Label className={hours.enabled ? "" : "text-muted-foreground"}>
                    {DAY_LABELS[day]}
                  </Label>
                </div>
                {hours.enabled ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={hours.start}
                      onChange={(e) => updateDayHours(day, "start", e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={hours.end}
                      onChange={(e) => updateDayHours(day, "end", e.target.value)}
                      className="w-32"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToAllDays(day)}
                      className="text-xs text-muted-foreground"
                    >
                      Copy to all
                    </Button>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Closed</span>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Settings</CardTitle>
          <CardDescription>
            Configure session and scheduling behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxConcurrent">Maximum concurrent sessions</Label>
            <p className="text-xs text-muted-foreground">
              How many sessions can run at the same time (e.g., via Sandboxie or multiple lobbies)
            </p>
            <Input
              id="maxConcurrent"
              type="number"
              min={1}
              max={10}
              value={settings.maxConcurrentSessions}
              onChange={(e) =>
                setSettings((s) => ({ ...s, maxConcurrentSessions: parseInt(e.target.value) || 3 }))
              }
              className="w-32"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="proofRequired"
              checked={settings.proofRequired}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, proofRequired: checked === true }))
              }
            />
            <Label htmlFor="proofRequired">
              Require proof screenshot before marking sessions complete
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="archiveDays">Auto-archive finished items after (days)</Label>
            <Input
              id="archiveDays"
              type="number"
              min={1}
              max={365}
              value={settings.autoArchiveDays}
              onChange={(e) =>
                setSettings((s) => ({ ...s, autoArchiveDays: parseInt(e.target.value) || 7 }))
              }
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integration Info</CardTitle>
          <CardDescription>
            Details about your integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Stripe Mode</Label>
            <div className="mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                process.env.NEXT_PUBLIC_STRIPE_MODE === "test"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}>
                {process.env.NEXT_PUBLIC_STRIPE_MODE === "test" ? "Test Mode" : "Live Mode"}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Stripe Webhook URL</Label>
            <code className="block mt-1 p-2 bg-muted rounded text-sm">
              {typeof window !== "undefined" ? `${window.location.origin}/api/stripe-webhook` : "/api/stripe-webhook"}
            </code>
            <p className="text-xs text-muted-foreground mt-1">
              Add this URL to your Stripe Dashboard &gt; Developers &gt; Webhooks
            </p>
          </div>

          {process.env.NEXT_PUBLIC_STRIPE_MODE === "test" && (
            <>
              <div>
                <Label className="text-muted-foreground">Test Card Numbers</Label>
                <div className="mt-1 space-y-1">
                  <code className="block p-2 bg-muted rounded text-sm">
                    4242 4242 4242 4242 — Succeeds
                  </code>
                  <code className="block p-2 bg-muted rounded text-sm">
                    4000 0000 0000 0002 — Declines
                  </code>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use any future exp date, any CVC, any ZIP
                </p>
              </div>

              {pendingCheckouts.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <Label className="text-amber-600 dark:text-amber-400">Pending Checkouts ({pendingCheckouts.length})</Label>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    These checkouts were started but the webhook was not received. You can manually process them.
                  </p>
                  <div className="space-y-2">
                    {pendingCheckouts.map((checkout) => (
                      <div key={checkout.id} className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/30 rounded-md">
                        <div className="text-sm">
                          <span className="font-medium">{checkout.discord_username}</span>
                          <span className="text-muted-foreground"> — {checkout.package_name}</span>
                          <span className="text-xs text-muted-foreground block">
                            {new Date(checkout.created_at).toLocaleString()}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const amount = prompt(`Enter amount for ${checkout.package_name} (check package prices):`)
                            if (amount) {
                              handleProcessPending(checkout.id, parseFloat(amount))
                            }
                          }}
                          disabled={processingId === checkout.id}
                        >
                          {processingId === checkout.id ? "Processing..." : "Process"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingCheckouts.length === 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">No pending checkouts</span>
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <Label className="text-muted-foreground">Cron Job URL</Label>
            <code className="block mt-1 p-2 bg-muted rounded text-sm">
              {typeof window !== "undefined" ? `${window.location.origin}/api/cron/auto-move` : "/api/cron/auto-move"}
            </code>
            <p className="text-xs text-muted-foreground mt-1">
              This runs automatically every 5 minutes on Vercel
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
