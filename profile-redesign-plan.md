# Profile View Redesign Plan

## Current Issues Analysis
- **Timeout problems**: Complex timeout wrapper causing confusion
- **Disorganized code**: Mix of concerns in single component
- **Poor error handling**: Generic error messages, unclear states
- **Inefficient data flow**: Multiple state variables for same data
- **No proper loading states**: Basic spinner instead of proper UX

## Database Assumptions
- **One resume per user**: Unique constraint on `user_id` in resumes table
- **Direct queries**: No need for complex fallback logic
- **Simple operations**: Insert for new users, update for existing users

## Redesign Architecture

### 1. Hook-based Data Management
Create custom hooks to separate concerns:
- `useResumeData(userId)` - Fetches and caches resume data
- `useResumeSave(userId)` - Handles save operations with optimistic updates
- `usePDFGeneration()` - Manages PDF generation state

### 2. Component Structure
```
ProfileView/
├── ProfileHeader - Navigation and title
├── ResumeEditor - Editor with auto-save
├── ResumePreview - Live preview panel
└── StatusBar - Save status, messages, actions
```

### 3. State Management Strategy
**Single source of truth:**
- `resumeData` - Current resume content
- `loadingState` - 'loading' | 'error' | 'ready' | 'saving'
- `lastSaved` - Timestamp for save status
- `isDirty` - Has unsaved changes

### 4. Error Handling
**Specific error types:**
- Network errors (retry with exponential backoff)
- Validation errors (inline feedback)
- Permission errors (clear messaging)
- Timeout errors (manual retry option)

### 5. Performance Optimizations
- **Debounced auto-save** (3 seconds after typing stops)
- **Optimistic updates** (instant UI feedback)
- **Cached queries** (avoid re-fetching on mount)
- **Lazy preview rendering** (only when preview panel is open)

## Implementation Plan

### Step 1: Custom Hooks
Create `hooks/useResumeManager.ts`:
```typescript
interface ResumeState {
  content: string
  loadingState: 'loading' | 'error' | 'ready' | 'saving'
  error: string | null
  lastSaved: Date | null
  isDirty: boolean
}

function useResumeManager(userId: string) {
  // Data fetching with React Query
  // Auto-save functionality
  // Optimistic updates
  // Error recovery
}
```

### Step 2: Component Separation
Break down into focused components:
- **ProfileHeader** - Navigation, user info
- **ResumeEditor** - Textarea with validation
- **ResumePreview** - Markdown rendering
- **SaveStatus** - Save state indicator

### Step 3: Database Operations
Simplify resume operations:
```typescript
// Simple upsert operation (single function)
async function saveResume(userId: string, content: string) {
  // Try update first, then insert if no rows affected
  // Handle foreign key constraints properly
  // Return clear success/error states
}

// Simple fetch operation
async function getResume(userId: string) {
  // Single query with proper error handling
  // Return null if no resume exists
  // No timeout wrappers needed
}
```

### Step 4: Loading States
**Progressive enhancement:**
- Skeleton loader while fetching
- Inline save indicators
- Non-blocking error messages
- Graceful degradation

### Step 5: User Experience
**Smooth interactions:**
- Auto-save every 3 seconds
- Save status always visible
- Immediate feedback on actions
- Clear error messages with actions

## Technical Specifications

### Database Operations
```sql
-- Simple upsert pattern
INSERT INTO resumes (user_id, resume_md) 
VALUES ($1, $2)
ON CONFLICT (user_id) 
DO UPDATE SET 
  resume_md = EXCLUDED.resume_md,
  created_at = NOW()
RETURNING *;
```

### Error Recovery
- **Network errors**: Automatic retry with exponential backoff
- **Validation errors**: Inline highlighting and suggestions
- **Save conflicts**: Show diff and merge options
- **Lost connection**: Queue saves and retry when online

### State Management
- **React Query** for server state
- **Local state** for UI interactions
- **Optimistic updates** for immediate feedback
- **Background sync** for reliability

## File Structure

### New Files:
- `hooks/useResumeManager.ts` - Main data management
- `hooks/usePDFGeneration.ts` - PDF generation logic
- `components/profile/ProfileHeader.tsx` - Header component
- `components/profile/ResumeEditor.tsx` - Editor component
- `components/profile/ResumePreview.tsx` - Preview component
- `components/profile/SaveStatus.tsx` - Status indicator
- `lib/database/resume-service.ts` - Simplified DB operations

### Modified Files:
- `components/profile-view.tsx` - Simplified main component
- `lib/database/resume-operations.ts` - Clean up operations

## Success Criteria

### Performance:
- Initial load: < 300ms
- Save operations: < 500ms
- Zero timeout errors
- Smooth transitions

### User Experience:
- Clear loading states
- Immediate save feedback
- Descriptive error messages
- No data loss scenarios

### Code Quality:
- Single responsibility components
- Proper error boundaries
- Comprehensive TypeScript types
- Unit testable hooks

This redesign will create a robust, user-friendly profile management experience with clean, maintainable code.