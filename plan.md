# Resume State Management Update Plan

## Current State Analysis

Based on the codebase analysis, I've identified the current authentication and resume flow:

### Current Architecture:
- **AuthContext** (`contexts/auth-context.tsx`) manages authentication and resume state
- **Resume state** is tracked via `hasResume` boolean and `resumeMd` content
- **Database** has a new `has_resume` boolean field in the user table (as mentioned)
- **Main routing** (`app/page.tsx`) checks `hasResume` to determine user flow

### Current Issue:
The system currently fetches the full resume content from the `resumes` table to determine if a user has a resume, but now that there's a `has_resume` boolean in the user table, we should use that instead for better performance and smoother UX.

## Proposed Changes

### 1. Update AuthContext to Use Database `has_resume` Field
**File:** `contexts/auth-context.tsx`

**Changes:**
- Modify the authentication flow to fetch user profile data including `has_resume` boolean
- Update `hasResume` state to be set from the database field instead of checking resume content existence
- Keep the existing `resumeMd` lazy-loading for when it's actually needed (like in dashboard)
- Add a function to update the `has_resume` field when resume is saved/deleted

### 2. Update Resume Operations to Sync Boolean Field
**File:** `lib/database/resume-operations.ts`

**Changes:**
- Modify `saveUserResume()` to also update the `has_resume` boolean to `true` in the user table
- Add a new function to update user's `has_resume` status
- Ensure both tables stay in sync when resume is saved or deleted

### 3. Update Resume Setup Flow
**File:** `components/resume-setup-view.tsx`

**Changes:**
- After successful resume save, update the user's `has_resume` boolean
- Refresh the auth context to reflect the new status
- Ensure smooth transition to dashboard after setup

### 4. Fix Main App Routing Logic
**File:** `app/page.tsx`

**Changes:**
- Fix the routing logic to properly direct users without resumes to the setup view
- Ensure the flow is: Login → Check `has_resume` → Route to Setup or Dashboard

## Implementation Steps

### Step 1: Update Database Operations
- Add function to update user's `has_resume` field
- Modify `saveUserResume()` to update both tables atomically
- Add function to get user profile data including `has_resume`

### Step 2: Update AuthContext
- Add user profile fetching on authentication
- Set `hasResume` from database boolean field
- Keep `resumeMd` lazy-loading for performance
- Add function to sync `has_resume` field

### Step 3: Update Resume Setup Component
- Ensure it updates the `has_resume` boolean on successful save
- Refresh auth context after resume setup completion

### Step 4: Fix App Routing
- Correct the routing logic to use setup view when `hasResume` is false
- Ensure smooth flow from authentication to appropriate view

### Step 5: Test the Complete Flow
- Test authentication with existing resume
- Test authentication without resume (should go to setup)
- Test resume setup completion (should go to dashboard)
- Verify state consistency across all components

## Benefits of This Approach

1. **Better Performance**: No need to fetch full resume content just to check existence
2. **Smoother UX**: Immediate routing decisions based on boolean field
3. **Consistency**: Single source of truth for resume existence
4. **Scalability**: Better for when user base grows

## Files to be Modified

1. `contexts/auth-context.tsx` - Update authentication state management
2. `lib/database/resume-operations.ts` - Add user profile operations
3. `components/resume-setup-view.tsx` - Update save flow
4. `app/page.tsx` - Fix routing logic

## Assumptions

- The user table now has a `has_resume` boolean field
- The field is properly indexed and maintained
- Existing users have this field populated correctly

## Timeline

This should be a relatively quick update (1-2 hours) since the infrastructure is already in place - we're just optimizing the data fetching and state management approach.