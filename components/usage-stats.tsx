"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getUsageStats, logUsageEvent, UsageStats } from '@/lib/database/usage-operations'
import { useAuth } from '@/contexts/auth-context'

interface UsageStatsProps {
  className?: string
  compact?: boolean
}

export function UsageStatsComponent({ className = '', compact = false }: UsageStatsProps) {
  const { user } = useAuth()
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchUsageStats = async () => {
    if (!user?.id) return

    try {
      setError(null)
      const result = await getUsageStats(user.id)
      
      if (result.success && result.data) {
        setUsageStats(result.data)
        logUsageEvent('fetch', user.id, true)
      } else {
        setError(result.error || 'Failed to fetch usage statistics')
        logUsageEvent('fetch', user.id, false, result.error)
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      logUsageEvent('fetch', user.id, false, errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchUsageStats()
    setRefreshing(false)
  }

  useEffect(() => {
    if (user?.id) {
      fetchUsageStats()
    } else {
      setLoading(false)
    }
  }, [user?.id])

  // Don't render if no user
  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-[#00FFAA] border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 text-sm">Loading usage...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <AlertCircle className="w-4 h-4 text-red-400" />
        <span className="text-red-400 text-sm">Failed to load usage</span>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          className="text-red-400 hover:text-red-300 p-1 h-auto"
          disabled={refreshing}
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    )
  }

  const totalRuns = usageStats?.total_runs || 0

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Activity className="w-4 h-4 text-[#00FFAA]" />
        <span className="text-gray-300 text-sm">
          <span className="text-[#00FFAA] font-medium">{totalRuns}</span> runs
        </span>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-[#00FFAA] p-1 h-auto"
          disabled={refreshing}
          title="Refresh usage stats"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#00FFAA]/20 rounded-full flex items-center justify-center">
            <Activity className="w-4 h-4 text-[#00FFAA]" />
          </div>
          <h3 className="text-white font-medium">Usage Statistics</h3>
        </div>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-[#00FFAA] p-2 h-auto"
          disabled={refreshing}
          title="Refresh usage stats"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-300 text-sm">Resume Optimizations</span>
          <span className="text-[#00FFAA] font-bold text-lg">{totalRuns}</span>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((totalRuns / 50) * 100, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[#00FFAA] to-[#00DD99]"
          />
        </div>
        
        {totalRuns < 50 ? (
          <p className="text-gray-400 text-xs">
            {50 - totalRuns} more runs until milestone
          </p>
        ) : (
          <p className="text-[#00FFAA] text-xs font-medium">
            Milestone reached! 🎉
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default UsageStatsComponent