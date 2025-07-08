# State Management Documentation

This document provides a comprehensive overview of all state management patterns, files, and flows in the ATS Fit Dashboard application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Global State Management](#global-state-management)
3. [Local State Management](#local-state-management)
4. [Custom Hooks](#custom-hooks)
5. [Storage Layer](#storage-layer)
6. [State Flow Patterns](#state-flow-patterns)
7. [File Organization](#file-organization)
8. [Best Practices](#best-practices)

## Architecture Overview

The application uses a **hybrid state management approach** combining:
- **React Context API** for global authentication and user state
- **useState hooks** for local component state
- **Custom hooks** for complex reusable stateful logic
- **SessionStorage** for caching and performance optimization
- **TypeScript interfaces** for type safety

```
┌─────────────────────────────────────────────────────────────┐
│                    Global State Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   AuthContext   │  │  Theme Provider │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                             │
┌─────────────────────────────────────────────────────────────┐
│                 Application State Layer                     │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   App Routing   │  │  Component UI   │                  │
│  │     State       │  │     States      │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                             │
┌─────────────────────────────────────────────────────────────┐
│                    Custom Hooks Layer                      │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  useResumeManager │  │ usePDFGeneration │                │
│  │    useToast     │  │   useIsMobile   │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                             │
┌─────────────────────────────────────────────────────────────┐
│                     Storage Layer                          │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  SessionStorage │  │    Supabase     │                  │
│  │     Cache       │  │    Database     │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Global State Management

### AuthContext (`/contexts/auth-context.tsx`)

The primary global state provider managing authentication and user data.

#### State Variables
```typescript
interface AuthContextType {
  user: User | null                    // Current Supabase user object
  session: Session | null              // Current Supabase session
  loading: boolean                     // Authentication loading state
  resumeMd: string | null              // User's resume content (markdown)
  hasResume: boolean                   // Whether user has uploaded resume
  
  // Actions
  signUp: (email: string, password: string) => Promise<{data: any; error: any}>
  signIn: (email: string, password: string) => Promise<{data: any; error: any}>
  signOut: () => Promise<{error: any}>
  refreshResume: () => Promise<void>
  refreshUserProfile: () => Promise<void>
  updateResumeCache: (newResumeContent: string) => void
}
```

#### Key Features
- **Automatic session management** with Supabase auth state changes
- **Smart caching** with 30-minute expiration in sessionStorage
- **Optimistic updates** for better UX performance
- **Error handling** with fallback states
- **Cache invalidation** on sign out

#### Usage Pattern
```typescript
// In any component
const { user, resumeMd, hasResume, signOut } = useAuth()

// Check authentication
if (!user) {
  router.push('/login')
  return
}

// Access resume data
if (hasResume) {
  // Display resume content
  console.log(resumeMd)
}
```

### Theme Provider (`/components/theme-provider.tsx`)

Simple wrapper around Next.js themes for dark/light mode.

```typescript
// Minimal state management
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

## Local State Management

### Main Application State (`/app/page.tsx`)

Controls app-level routing and user flow.

```typescript
// App routing state
type AppState = "dashboard" | "profile" | "results" | "resume-setup"

// State variables
const [currentState, setCurrentState] = useState<AppState>("dashboard")
const [user, setUser] = useState<User | null>(null)
const [hasInitialized, setHasInitialized] = useState(false)

// Auth integration
const { user: authUser, loading: authLoading, hasResume } = useAuth()
```

#### State Flow
1. **Check authentication** → Redirect to `/login` if not authenticated
2. **Check resume existence** → Route to `resume-setup` or `dashboard`
3. **Handle navigation** between different app states
4. **Manage loading states** during initialization

### Dashboard State (`/components/dashboard-view.tsx`)

Complex form and processing state for resume optimization.

#### Form States
```typescript
const [jobDescription, setJobDescription] = useState("")
const [userNotes, setUserNotes] = useState("")
const [keywords, setKeywords] = useState<string[]>([])
const [error, setError] = useState("")
```

#### Processing States
```typescript
const [isSubmitting, setIsSubmitting] = useState(false)
const [progress, setProgress] = useState(0)
const [currentStep, setCurrentStep] = useState("")
const [abortController, setAbortController] = useState<AbortController | null>(null)
```

#### Data States
```typescript
const [currentAtsResult, setCurrentAtsResult] = useState<AtsScoreResult | null>(null)
const [optimizationResults, setOptimizationResults] = useState<{
  optimizedResume: string
  initialAtsScore: number
  finalAtsScore: number
  missingKeywordsCount: number
} | null>(null)
```

#### UI States
```typescript
const [showResults, setShowResults] = useState(false)
const [editingKeywordIndex, setEditingKeywordIndex] = useState<number | null>(null)
const [editingKeywordValue, setEditingKeywordValue] = useState("")
```

### Profile Management State (`/app/profile/page.tsx`)

Resume editing and management interface.

```typescript
const [resumeContent, setResumeContent] = useState("")
const [hasInitialized, setHasInitialized] = useState(false)
const [hasChanges, setHasChanges] = useState(false)
const [showPreview, setShowPreview] = useState(false)
const [message, setMessage] = useState("")
const [isSaving, setIsSaving] = useState(false)
const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
```

### Authentication State (`/app/login/page.tsx`)

Login and signup form management.

```typescript
const [showSignup, setShowSignup] = useState(false)
const [showLogin, setShowLogin] = useState(false)
const [email, setEmail] = useState("")
const [password, setPassword] = useState("")
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState("")
```

## Custom Hooks

### useResumeManager (`/hooks/useResumeManager.ts`)

Complex resume data management with auto-retry functionality.

#### State Interface
```typescript
interface ResumeState {
  content: string              // Current resume content
  originalContent: string      // Original content for change tracking
  loadingState: 'loading' | 'error' | 'ready' | 'saving'
  error: string | null         // Error message if any
  lastSaved: Date | null       // Last save timestamp
  isDirty: boolean            // Whether content has been modified
  retryCount: number          // Number of retry attempts
}
```

#### Actions
```typescript
const {
  state,
  updateContent,      // Update resume content
  saveResume,         // Save with auto-retry (3 attempts)
  resetToOriginal,    // Reset to original state
  retry              // Manual retry for failed operations
} = useResumeManager(userId)
```

#### Features
- **Auto-retry logic** with exponential backoff
- **Content validation** before saving
- **Change tracking** with dirty state
- **Error recovery** with manual retry options

### usePDFGeneration (`/hooks/usePDFGeneration.ts`)

PDF generation state management with progress tracking.

#### State Interface
```typescript
interface PDFState {
  isGenerating: boolean        // Whether PDF is being generated
  progress: number            // Progress percentage (0-100)
  stage: string              // Current generation stage
  error: string | null       // Error message if any
  lastGenerated: Date | null // Last generation timestamp
}
```

#### Usage
```typescript
const { state, generatePDF, reset } = usePDFGeneration()

// Generate PDF with progress tracking
const handleGeneratePDF = async () => {
  try {
    const pdfBlob = await generatePDF(resumeContent)
    // Handle success
  } catch (error) {
    // Handle error
  }
}
```

### useToast (`/hooks/use-toast.ts`)

Global toast notification system inspired by react-hot-toast.

#### State Management
```typescript
type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

// Global state with reducer pattern
const [state, dispatch] = React.useReducer(reducer, {
  toasts: [],
})
```

#### Usage
```typescript
import { toast } from "@/hooks/use-toast"

// Show success toast
toast({
  title: "Success!",
  description: "Resume saved successfully",
})

// Show error toast
toast({
  title: "Error",
  description: "Failed to save resume",
  variant: "destructive",
})
```

### useIsMobile (`/hooks/use-mobile.tsx`)

Responsive design hook for mobile breakpoint detection.

```typescript
const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  
  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)")
    // Handle media query changes
  }, [])
  
  return isMobile
}
```

## Storage Layer

### SessionStorage Caching

#### AuthContext Cache
```typescript
const CACHE_KEYS = {
  AUTH_STATE: 'atsfit_auth_state',
  USER_PROFILE: 'atsfit_user_profile',
  RESUME_MD: 'atsfit_resume_md'
}

// Cache structure
interface CacheData {
  user: User | null
  resumeMd: string | null
  timestamp: number           // For 30-minute expiration
}
```

#### Results Navigation Cache
```typescript
// Store large resume content during navigation
const cacheKey = `resume_content_${timestamp}`
sessionStorage.setItem(cacheKey, resumeContent)

// Cleanup after successful retrieval
sessionStorage.removeItem(cacheKey)
```

### Database Integration

#### Supabase Tables
- **`users`** - User authentication data
- **`resumes`** - Resume content and metadata
- **`user_profiles`** - User profile information

#### Database Operations
```typescript
// Fetch user resume
const { data, error } = await supabase
  .from('resumes')
  .select('resume_md')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()

// Save resume
const { error } = await supabase
  .from('resumes')
  .upsert({
    user_id: userId,
    resume_md: content,
    updated_at: new Date().toISOString()
  })
```

## State Flow Patterns

### Authentication Flow
```
1. App starts → Check cached auth state
2. If cached → Use immediately, verify in background
3. If not cached → Query Supabase session
4. Auth state change → Update context and cache
5. Sign out → Clear cache and redirect
```

### Resume Optimization Flow
```
1. User enters job description
2. Extract keywords (debounced)
3. Calculate ATS score
4. User submits optimization
5. Progress tracking with steps
6. Show results with before/after
```

### Data Persistence Flow
```
1. User makes changes
2. Update local state immediately
3. Mark as dirty/unsaved
4. Save to database (with retry)
5. Update cache optimistically
6. Handle errors gracefully
```

## File Organization

### Context Files
- `/contexts/auth-context.tsx` - Authentication context

### Custom Hooks
- `/hooks/useResumeManager.ts` - Resume management
- `/hooks/usePDFGeneration.ts` - PDF generation
- `/hooks/use-toast.ts` - Toast notifications
- `/hooks/use-mobile.tsx` - Mobile detection

### Utilities
- `/lib/utils/ats-scorer.ts` - ATS scoring algorithm
- `/lib/utils/results-validation.ts` - Results validation
- `/lib/utils/preview-renderer.ts` - Markdown to HTML
- `/lib/utils/html-parser.ts` - HTML parsing for PDF

### Component State
- `/app/page.tsx` - Main app routing state
- `/app/login/page.tsx` - Authentication forms
- `/app/profile/page.tsx` - Profile management
- `/components/dashboard-view.tsx` - Dashboard state

## Best Practices

### State Management
1. **Use Context for global state** that needs to be accessed across components
2. **Keep local state local** - don't lift state unnecessarily
3. **Custom hooks for complex logic** - encapsulate stateful behavior
4. **Type safety** - Use TypeScript interfaces for all state shapes

### Performance Optimization
1. **Cache frequently used data** with appropriate expiration
2. **Debounce expensive operations** (keyword extraction)
3. **Optimistic updates** for better UX
4. **Lazy loading** for heavy components

### Error Handling
1. **Graceful degradation** - handle errors without breaking UX
2. **Retry mechanisms** for transient failures
3. **Clear error messages** for users
4. **Fallback states** for missing data

### Data Flow
1. **Unidirectional data flow** - data flows down, events up
2. **Single source of truth** - avoid state duplication
3. **Immutable updates** - always create new state objects
4. **Predictable state changes** - use clear action patterns

This state management architecture provides a robust foundation for the application while maintaining simplicity and performance.