import { useUIStore } from '../index'
import { uiSelectors } from '../utils/selectors'

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  duration?: number
}

export interface ToastActionElement {
  altText?: string
  onClick: () => void
}

export interface ToastAction {
  action: ToastActionElement
  dispatch: (action: ToastAction) => void
}

export function useToast() {
  const toasts = useUIStore(state => state.toasts)
  const addToast = useUIStore(state => state.actions.addToast)
  const removeToast = useUIStore(state => state.actions.removeToast)
  const clearToasts = useUIStore(state => state.actions.clearToasts)

  const toast = (props: Omit<ToastProps, 'id'>) => {
    addToast(props)
  }

  const dismiss = (toastId?: string) => {
    if (toastId) {
      removeToast(toastId)
    } else {
      clearToasts()
    }
  }

  return {
    toast,
    dismiss,
    toasts,
  }
}