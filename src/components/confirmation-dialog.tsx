"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  confirmText: string
  onConfirm: () => void
}

export default function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmText,
  onConfirm
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-700">{message}</p>
          <div className="flex gap-2">
            <Button 
              onClick={handleConfirm} 
              variant="destructive"
            >
              {confirmText}
            </Button>
            <Button 
              onClick={() => onOpenChange(false)} 
              variant="outline"
            >
              Odustani
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 