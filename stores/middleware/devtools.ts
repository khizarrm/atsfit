import { StateCreator } from 'zustand'
import { devtools } from 'zustand/middleware'

interface DevtoolsConfig {
  name: string
  enabled?: boolean
}

export const createDevtoolsMiddleware = <T>(
  config: DevtoolsConfig
) => {
  if (!config.enabled || typeof window === 'undefined') {
    return (f: StateCreator<T, [], [], T>) => f
  }

  return devtools(() => ({} as T), {
    name: config.name,
    enabled: process.env.NODE_ENV === 'development',
  })
}

export const devtoolsConfig = {
  auth: {
    name: 'Auth Store',
    enabled: process.env.NODE_ENV === 'development',
  },
  resume: {
    name: 'Resume Store',
    enabled: process.env.NODE_ENV === 'development',
  },
  ui: {
    name: 'UI Store',
    enabled: process.env.NODE_ENV === 'development',
  },
}