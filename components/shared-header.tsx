"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import { User, LogOut, ChevronDown, UserCog, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { DeleteAccountModal } from "@/components/delete-account-modal"
import { deleteUserAccount } from "@/lib/database/resume-operations"
import { useRouter } from "next/navigation"

interface SharedHeaderProps {
  title?: string // Custom title, defaults to "ATSFit"
  leftContent?: React.ReactNode // Custom left content (like back button)
  rightContent?: React.ReactNode // Custom right content (overrides default profile dropdown)
  onGoToProfile?: () => void // Profile navigation handler
  onSignUp?: () => void // Sign up handler for non-authenticated users
  user?: any | null // User object
}

export function SharedHeader({ 
  title = "Passr",
  leftContent,
  rightContent,
  onGoToProfile,
  onSignUp,
  user
}: SharedHeaderProps) {
  const { signOut } = useAuth()
  const router = useRouter()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      setShowProfileDropdown(false)
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
      setIsLoggingOut(false)
    }
  }

  const handleProfileNavigation = () => {
    setIsNavigating(true)
    setShowProfileDropdown(false)
    if (onGoToProfile) {
      onGoToProfile()
    }
    // Reset navigation state after a short delay
    setTimeout(() => setIsNavigating(false), 1000)
  }

  const handleDeleteAccount = () => {
    setShowProfileDropdown(false)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!user) return
    
    try {
      setIsDeleting(true)
      const result = await deleteUserAccount(user.id)
      
      if (result.success) {
        // Clear cache and sign out
        await signOut()
        router.push('/login')
      } else {
        console.error('Failed to delete account:', result.error)
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error('Error deleting account:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }


  // Default left content (empty to maintain centering)
  const defaultLeftContent = (
    <div className="flex items-center space-x-4 w-16 sm:w-20 lg:w-24"> {/* Responsive width for centering */}
    </div>
  )

  // Default right content (profile dropdown or sign up)
  const defaultRightContent = (
    <div className="flex items-center space-x-2 sm:space-x-4 w-16 sm:w-20 lg:w-24 justify-end"> {/* Responsive width for centering */}
      {user ? (
        <div className="relative" ref={dropdownRef}>
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/10 hover:text-white h-8 sm:h-10 px-1 sm:px-2 flex items-center"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            <ChevronDown className="h-3 w-3 ml-0.5 sm:ml-1 hidden sm:block" />
          </Button>
          
          {showProfileDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-50"
            >
              <div className="p-2">
                {onGoToProfile && (
                  <Button
                    variant="ghost"
                    disabled={isNavigating}
                    className="w-full justify-start text-white hover:bg-white/10 hover:text-white disabled:opacity-50"
                    onClick={handleProfileNavigation}
                  >
                    {isNavigating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Opening...
                      </>
                    ) : (
                      <>
                        <UserCog className="h-4 w-4 mr-2" />
                        Manage Resume
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  disabled={isLoggingOut}
                  className="w-full justify-start text-white hover:bg-white/10 hover:text-white disabled:opacity-50"
                  onClick={handleLogout}
                >
                  {isLoggingOut ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Signing out...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </>
                  )}
                </Button>
                <div className="border-t border-white/10 my-1"></div>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={handleDeleteAccount}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        onSignUp && (
          <Button
            onClick={onSignUp}
            className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-semibold px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all duration-300 whitespace-nowrap"
          >
            <span className="hidden sm:inline">Get Started Free</span>
            <span className="sm:hidden">Sign Up</span>
          </Button>
        )
      )}
    </div>
  )

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.05 }}
      className="flex items-center justify-between p-3 sm:p-4 lg:p-6 bg-white/3 backdrop-blur-xl border-b border-white/5"
    >
      {leftContent || defaultLeftContent}
      
      <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-[#00FFAA] to-[#00CC88] bg-clip-text text-transparent flex-1 text-center px-2 sm:px-4">
        {title}
      </h1>
      
      {rightContent || defaultRightContent}
      
      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        userEmail={user?.email}
        isDeleting={isDeleting}
      />
    </motion.nav>
  )
}