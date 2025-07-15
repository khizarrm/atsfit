"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  userEmail?: string
  isDeleting?: boolean
}

export function DeleteAccountModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userEmail, 
  isDeleting = false 
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("")
  const [mounted, setMounted] = useState(false)
  const confirmationPhrase = "DELETE MY ACCOUNT"
  const canConfirm = confirmText === confirmationPhrase

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const handleConfirm = async () => {
    if (canConfirm) {
      await onConfirm()
      setConfirmText("")
    }
  }

  const handleClose = () => {
    setConfirmText("")
    onClose()
  }

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Delete Account</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-gray-400 hover:text-white hover:bg-white/10"
            disabled={isDeleting}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Warning Content */}
        <div className="mb-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
            <p className="text-red-400 text-sm font-medium mb-2">
              ⚠️ This action cannot be undone
            </p>
            <p className="text-red-300 text-sm">
              Deleting your account will permanently remove:
            </p>
            <ul className="text-red-300 text-sm mt-2 space-y-1 list-disc list-inside">
              <li>Your resume data</li>
              <li>All saved job analyses</li>
              <li>Account settings and preferences</li>
            </ul>
          </div>

          {userEmail && (
            <p className="text-gray-400 text-sm mb-4">
              Account to delete: <span className="text-white font-medium">{userEmail}</span>
            </p>
          )}

          <div className="space-y-3">
            <label className="text-white text-sm font-medium">
              Type "<span className="text-red-400 font-bold">{confirmationPhrase}</span>" to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type the confirmation phrase"
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none"
              disabled={isDeleting}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
                Deleting...
              </>
            ) : (
              "Delete Account"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  )

  return createPortal(modalContent, document.body)
}