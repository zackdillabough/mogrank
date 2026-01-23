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
  const [description, setDescription] = useState(pkg?.description || "")
  const [price, setPrice] = useState(pkg?.price?.toString() || "")
  const [levels, setLevels] = useState(pkg?.levels?.toString() || "")
  const [durationMinutes, setDurationMinutes] = useState(pkg?.duration_minutes?.toString() || "")
  const [active, setActive] = useState(pkg?.active ?? true)

  const isEditing = !!pkg

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const body = {
        ...(isEditing && { id: pkg.id }),
        name,
        description,
        price: parseFloat(price),
        levels: parseInt(levels),
        duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
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
    setDescription(pkg?.description || "")
    setPrice(pkg?.price?.toString() || "")
    setLevels(pkg?.levels?.toString() || "")
    setDurationMinutes(pkg?.duration_minutes?.toString() || "")
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Package" : "Add Package"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Starter"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 100 levels in ~15 minutes (AFK-friendly)"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
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
              <Label htmlFor="levels">Levels</Label>
              <Input
                id="levels"
                type="number"
                min="1"
                value={levels}
                onChange={(e) => setLevels(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="Optional"
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
      </DialogContent>
    </Dialog>
  )
}
