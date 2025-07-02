import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Eye, EyeOff } from "lucide-react"

interface ProfileHeaderProps {
  onBack: () => void
  showPreview: boolean
  onTogglePreview: () => void
  user: {
    id: string
    email: string
    name: string
  } | null
}

export function ProfileHeader({ onBack, showPreview, onTogglePreview, user }: ProfileHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-6"
    >
      {/* Back Button */}
      <div className="flex justify-start mb-4">
        <Button 
          onClick={onBack} 
          variant="ghost" 
          className="text-white hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Header Content */}
      <div className="flex items-center justify-center mb-3">
        <div className="w-10 h-10 bg-gradient-to-r from-[#00FFAA] to-[#00DD99] rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-black" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-2">Manage Your Resume</h2>
      
      <div className="flex items-center justify-center space-x-4">
        <p className="text-gray-400 text-sm">
          Edit your resume markdown and preview the formatted output
        </p>
        
        <Button
          onClick={onTogglePreview}
          variant="outline"
          size="sm"
          className="bg-black/40 backdrop-blur-md border-[#00FFAA]/50 text-[#00FFAA] hover:bg-[#00FFAA]/20 hover:border-[#00FFAA] hover:shadow-[0_0_10px_rgba(0,255,170,0.3)] transition-all duration-300"
        >
          {showPreview ? <EyeOff className="mr-2 h-3 w-3" /> : <Eye className="mr-2 h-3 w-3" />}
          {showPreview ? "Hide Preview" : "Show Preview"}
        </Button>
      </div>
      
      {user && (
        <p className="text-gray-500 text-xs mt-2">
          Editing resume for {user.email}
        </p>
      )}
    </motion.div>
  )
}