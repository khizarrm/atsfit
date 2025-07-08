"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

interface ThemeToggleProps {
  variant?: 'icon' | 'button'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function ThemeToggle({
  variant = 'icon',
  size = 'md',
  showLabel = false,
  className = ''
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatches
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`text-app-primary hover:bg-surface ${className}`}
      >
        <div className="h-5 w-5" />
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'

  if (variant === 'button') {
    return (
      <Button
        onClick={toggleTheme}
        variant="outline"
        className={`
          relative overflow-hidden
          bg-surface border-border
          text-app-primary hover:text-app-primary
          hover:bg-surface/80
          transition-all duration-300
          ${className}
        `}
      >
        <div className="flex items-center space-x-2">
          <div className="relative">
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <Moon className={iconSize} />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <Sun className={iconSize} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {showLabel && (
            <span className="text-sm font-medium">
              {isDark ? 'Dark' : 'Light'}
            </span>
          )}
        </div>
      </Button>
    )
  }

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className={`
        relative overflow-hidden
        text-app-primary hover:text-app-primary
        hover:bg-surface
        transition-all duration-300
        group
        ${className}
      `}
    >
      <div className="relative">
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Moon className={`${iconSize} group-hover:text-brand-primary transition-colors duration-200`} />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, opacity: 0, scale: 0.8 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Sun className={`${iconSize} group-hover:text-brand-primary transition-colors duration-200`} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Subtle glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-md"
        initial={{ opacity: 0 }}
        whileHover={{ 
          opacity: 1,
          boxShadow: isDark 
            ? "0 0 20px rgba(0, 255, 170, 0.2)" 
            : "0 0 20px rgba(0, 255, 170, 0.15)"
        }}
        transition={{ duration: 0.2 }}
      />
      
      <span className="sr-only">
        Switch to {isDark ? 'light' : 'dark'} mode
      </span>
    </Button>
  )
}