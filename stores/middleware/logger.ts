import { StateCreator } from 'zustand'

interface LoggerConfig {
  name: string
  enabled?: boolean
  collapsed?: boolean
  actionFilter?: (action: any) => boolean
}

export const createLoggerMiddleware = <T>(
  config: LoggerConfig
): ((
  f: StateCreator<T, [], [], T>
) => StateCreator<T, [], [], T>) => {
  if (!config.enabled || typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return (f) => f
  }

  return (f) => (set, get, api) => {
    const wrappedSet = (...args: any[]) => {
      const prevState = get()
      const result = set(...args)
      const nextState = get()
      
      const logGroup = config.collapsed ? console.groupCollapsed : console.group
      
      logGroup(`🏪 ${config.name} State Change`)
      console.log('Previous State:', prevState)
      console.log('Next State:', nextState)
      console.log('Args:', args)
      console.groupEnd()
      
      return result
    }

    return f(wrappedSet, get, api)
  }
}

export const loggerConfig = {
  auth: {
    name: 'Auth Store',
    enabled: process.env.NODE_ENV === 'development',
    collapsed: true,
  },
  resume: {
    name: 'Resume Store',
    enabled: process.env.NODE_ENV === 'development',
    collapsed: true,
  },
  ui: {
    name: 'UI Store',
    enabled: process.env.NODE_ENV === 'development',
    collapsed: true,
  },
}