import { StateCreator } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export const createImmerMiddleware = <T>(): ((
  f: StateCreator<T, [], [], T>
) => StateCreator<T, [], [], T>) => {
  return immer
}

export { immer }