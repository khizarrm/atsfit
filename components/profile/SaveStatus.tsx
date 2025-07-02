import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Save, CheckCircle, AlertCircle, RotateCcw } from "lucide-react"
import type { LoadingState } from "@/hooks/useResumeManager"

interface SaveStatusProps {
  loadingState: LoadingState
  isDirty: boolean
  lastSaved: Date | null
  error: string | null
  retryCount: number
  onSave: () => void
  onRetry: () => void
}

export function SaveStatus({ 
  loadingState, 
  isDirty, 
  lastSaved, 
  error, 
  retryCount,
  onSave, 
  onRetry 
}: SaveStatusProps) {
  const isSaving = loadingState === 'saving'
  const hasError = loadingState === 'error'
  const canSave = loadingState === 'ready' && isDirty

  const formatLastSaved = (date: Date | null) => {
    if (!date) return null
    
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor(diff / 1000)
    
    if (minutes > 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
    } else if (seconds > 5) {
      return `${seconds} seconds ago`
    } else {
      return 'just now'
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border-b border-white/5">
      <div className="flex items-center space-x-2">
        <Save className="w-4 h-4 text-[#00FFAA]" />
        <span className="text-white font-semibold">Resume Editor</span>
        
        {/* Save Status Indicator */}
        <div className="flex items-center space-x-2 ml-4">
          {isSaving && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-3 h-3 border-2 border-[#00FFAA] border-t-transparent rounded-full"
            />
          )}
          
          {hasError && (
            <AlertCircle className="w-3 h-3 text-red-400" />
          )}
          
          {!isSaving && !hasError && !isDirty && lastSaved && (
            <CheckCircle className="w-3 h-3 text-green-400" />
          )}
          
          <span className="text-xs text-gray-400">
            {isSaving && "Saving..."}
            {hasError && `Save failed${retryCount > 0 ? ` (attempt ${retryCount + 1})` : ''}`}
            {!isSaving && !hasError && isDirty && "Unsaved changes"}
            {!isSaving && !hasError && !isDirty && lastSaved && `Saved ${formatLastSaved(lastSaved)}`}
            {!isSaving && !hasError && !isDirty && !lastSaved && "Ready"}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {hasError && (
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
            className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Retry
          </Button>
        )}
        
        <Button
          onClick={onSave}
          disabled={!canSave || isSaving}
          size="sm"
          className={`font-semibold px-4 py-2 text-sm rounded-xl transition-all duration-300 ${
            canSave && !isSaving
              ? "bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black hover:scale-105"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSaving ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="w-3 h-3 border-2 border-black border-t-transparent rounded-full mr-2"
              />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-3 w-3" />
              {isDirty ? "Save Changes" : "Saved"}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}