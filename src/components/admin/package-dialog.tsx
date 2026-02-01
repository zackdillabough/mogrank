"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Package } from "@/lib/types"

interface PackageDialogProps {
  package?: Package
  trigger: React.ReactNode
  onSuccess: () => void
}

export function PackageDialog({ package: pkg, trigger, onSuccess }: PackageDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(pkg?.name || "")
  const [header, setHeader] = useState(pkg?.header || "")
  const [subtitle, setSubtitle] = useState(pkg?.subtitle || "")
  const [description, setDescription] = useState(pkg?.description || "")
  const [price, setPrice] = useState(pkg?.price?.toString() || "")
  const [imageUrl, setImageUrl] = useState(pkg?.image_url || "")
  const [estimatedDuration, setEstimatedDuration] = useState(pkg?.estimated_duration?.toString() || "60")
  const [active, setActive] = useState(pkg?.active ?? true)

  const isEditing = !!pkg

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const body = {
        ...(isEditing && { id: pkg.id }),
        name,
        header,
        subtitle,
        description: description || null,
        price: parseFloat(price),
        image_url: imageUrl || null,
        estimated_duration: parseInt(estimatedDuration) || 60,
        active,
      }

      const response = await fetch("/api/packages", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error("Failed to save package")
      }

      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Error saving package:", error)
      alert("Failed to save package. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName(pkg?.name || "")
    setHeader(pkg?.header || "")
    setSubtitle(pkg?.subtitle || "")
    setDescription(pkg?.description || "")
    setPrice(pkg?.price?.toString() || "")
    setImageUrl(pkg?.image_url || "")
    setEstimatedDuration(pkg?.estimated_duration?.toString() || "60")
    setActive(pkg?.active ?? true)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (isOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Package" : "Add Package"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 1 Prestige"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="header">Header</Label>
                <Input
                  id="header"
                  value={header}
                  onChange={(e) => setHeader(e.target.value)}
                  placeholder="e.g. 100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. levels"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Shown when card is expanded (optional)"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedDuration">Est. Duration (min)</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  step="5"
                  min="5"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={active}
                onCheckedChange={(checked) => setActive(checked === true)}
              />
              <Label htmlFor="active">Active (visible to customers)</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Package"}
              </Button>
            </div>
          </form>

          {/* Live Preview */}
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">Preview</p>
            <div className="w-[200px]">
              <div className="bg-white dark:bg-zinc-100 p-2 pb-10 shadow-lg relative">
                <div className="aspect-square bg-zinc-900 flex flex-col items-center justify-center p-3 relative overflow-hidden">
                  {imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-30"
                    />
                  )}
                  <div className="absolute inset-0 bg-radial-[at_center] from-black/60 via-black/30 to-transparent" />
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <p className="text-3xl font-bold text-white drop-shadow-lg">
                      {header || "—"}
                    </p>
                    <p className="text-sm text-zinc-300 mt-1">{subtitle || "—"}</p>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between font-[family-name:var(--font-permanent-marker)]">
                  <p className="text-zinc-800 text-sm">{name || "Name"}</p>
                  <p className="text-zinc-800 text-sm">$ {price || "0"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
