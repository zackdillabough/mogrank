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
import type { FAQ } from "@/lib/types"

interface FAQDialogProps {
  faq?: FAQ
  trigger: React.ReactNode
  onSuccess: () => void
}

export function FAQDialog({ faq, trigger, onSuccess }: FAQDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState(faq?.question || "")
  const [answer, setAnswer] = useState(faq?.answer || "")
  const [active, setActive] = useState(faq?.active ?? true)

  const isEditing = !!faq

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const body = {
        ...(isEditing && { id: faq.id }),
        question,
        answer,
        active,
      }

      const response = await fetch("/api/faq", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error("Failed to save FAQ")
      }

      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Error saving FAQ:", error)
      alert("Failed to save FAQ. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setQuestion(faq?.question || "")
    setAnswer(faq?.answer || "")
    setActive(faq?.active ?? true)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (isOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. How does this work?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">Answer</Label>
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="The answer shown when the question is expanded"
              rows={4}
              required
            />
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
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Create FAQ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
