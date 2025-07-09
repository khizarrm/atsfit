"use client"

import { useEffect } from 'react'
import { initializeStore } from '../index'

export function StoreInitializer() {
  useEffect(() => {
    let cleanup: (() => void) | undefined

    const init = async () => {
      try {
        cleanup = await initializeStore()
      } catch (error) {
        console.error('Failed to initialize store:', error)
      }
    }

    init()

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [])

  return null
}