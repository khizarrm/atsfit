import { motion } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { RotateCcw, AlertCircle } from "lucide-react"
import { SaveStatus } from "./SaveStatus"
import type { LoadingState } from "@/hooks/useResumeManager"

interface ResumeEditorProps {
  content: string
  loadingState: LoadingState
  isDirty: boolean
  lastSaved: Date | null
  error: string | null
  retryCount: number
  onContentChange: (content: string) => void
  onSave: () => void
  onRetry: () => void
  onReset: () => void
}

export function ResumeEditor({
  content,
  loadingState,
  isDirty,
  lastSaved,
  error,
  retryCount,
  onContentChange,
  onSave,
  onRetry,
  onReset
}: ResumeEditorProps) {
  const isDisabled = loadingState === 'loading' || loadingState === 'saving'

  return (
    <motion.div
      layout
      className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl"
    >
      {/* Header with Save Status */}
      <SaveStatus
        loadingState={loadingState}
        isDirty={isDirty}
        lastSaved={lastSaved}
        error={error}
        retryCount={retryCount}
        onSave={onSave}
        onRetry={onRetry}
      />

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-400 text-sm font-medium">Save Error</p>
            <p className="text-red-300 text-xs mt-1">{error}</p>
          </div>
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
            className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Retry
          </Button>
        </motion.div>
      )}

      {/* Editor Content */}
      <div className="p-4">
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          disabled={isDisabled}
          placeholder="Enter your resume in markdown format..."
          className={`min-h-[500px] bg-black/20 border-white/20 text-white placeholder:text-gray-500 focus:border-[#00FFAA] focus:ring-[#00FFAA] font-mono text-sm leading-relaxed resize-none transition-opacity duration-200 ${
            isDisabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
        
        <div className="flex items-center justify-between mt-3">
          <p className="text-gray-500 text-xs">
            Use markdown formatting. Follow the structure: # Name, contact info, --- dividers, ### sections
          </p>
          
          {isDirty && (
            <Button
              onClick={onReset}
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-white/10 text-xs"
              disabled={isDisabled}
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset Changes
            </Button>
          )}
        </div>
        
        {/* Character Count */}
        <div className="flex justify-end mt-2">
          <span className={`text-xs ${
            content.length > 45000 
              ? 'text-red-400' 
              : content.length > 40000 
                ? 'text-yellow-400' 
                : 'text-gray-500'
          }`}>
            {content.length.toLocaleString()} / 50,000 characters
          </span>
        </div>
      </div>
    </motion.div>
  )
}