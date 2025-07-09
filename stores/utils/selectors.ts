import { RootState } from '../types'

export const authSelectors = {
  user: (state: RootState) => state.auth.user,
  session: (state: RootState) => state.auth.session,
  isAuthenticated: (state: RootState) => !!state.auth.user,
  isLoading: (state: RootState) => state.auth.loading === 'loading',
  hasError: (state: RootState) => !!state.auth.error,
  hasResume: (state: RootState) => state.auth.hasResume,
  resumeMd: (state: RootState) => state.auth.resumeMd,
}

export const resumeSelectors = {
  content: (state: RootState) => state.resume.content,
  originalContent: (state: RootState) => state.resume.originalContent,
  isDirty: (state: RootState) => state.resume.isDirty,
  isLoading: (state: RootState) => state.resume.loading === 'loading',
  isSaving: (state: RootState) => state.resume.loading === 'loading' && state.resume.content !== state.resume.originalContent,
  hasError: (state: RootState) => !!state.resume.error,
  lastSaved: (state: RootState) => state.resume.lastSaved,
  versions: (state: RootState) => state.resume.versions,
  keywords: (state: RootState) => state.resume.keywords,
  keywordsLoading: (state: RootState) => state.resume.keywordsLoading,
  isGeneratingPDF: (state: RootState) => state.resume.isGeneratingPDF,
  pdfProgress: (state: RootState) => state.resume.pdfProgress,
}

export const uiSelectors = {
  theme: (state: RootState) => state.ui.theme,
  isMobile: (state: RootState) => state.ui.isMobile,
  toasts: (state: RootState) => state.ui.toasts,
  modals: (state: RootState) => state.ui.modals,
  currentPage: (state: RootState) => state.ui.navigation.currentPage,
  previousPage: (state: RootState) => state.ui.navigation.previousPage,
  progress: (state: RootState) => state.ui.progress,
}

export const createSelector = <T>(selector: (state: RootState) => T) => selector