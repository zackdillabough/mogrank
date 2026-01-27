"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface Settings {
  proofRequired: boolean
  autoArchiveDays: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    proofRequired: true,
    autoArchiveDays: 7,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Fetch settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings({
            proofRequired: data.settings.proof_required?.enabled ?? true,
            autoArchiveDays: data.settings.auto_archive_days?.days ?? 7,
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof_required: { enabled: settings.proofRequired },
          auto_archive_days: { days: settings.autoArchiveDays },
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
          <CardTitle>Queue Settings</CardTitle>
          <CardDescription>
            Configure how the queue behaves
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
