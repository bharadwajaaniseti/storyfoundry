'use client'

import React, { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cultureName: string
  onConfirm: () => void
  isDeleting?: boolean
}

export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  cultureName,
  onConfirm,
  isDeleting = false
}: DeleteConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState('')
  const isValid = confirmText === cultureName

  const handleConfirm = () => {
    if (isValid) {
      onConfirm()
    }
  }

  const handleClose = () => {
    setConfirmText('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white shadow-xl ring-1 ring-black/5 dark:bg-neutral-950 dark:ring-white/10">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Delete Culture
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            This action cannot be undone. This will permanently delete the culture and all its data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> You are about to delete &ldquo;{cultureName}&rdquo;
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-delete" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              To confirm, type the culture name: <strong>{cultureName}</strong>
            </Label>
            <Input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Enter culture name"
              className="w-full"
              autoComplete="off"
              disabled={isDeleting}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Deleting...
              </>
            ) : (
              'Delete Culture'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
