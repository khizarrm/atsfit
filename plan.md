# Auth Context Redesign Plan

## Current Issues
1. `getUserProfile` function is in resume-operations but it's not a resume operation - it's auth-related
2. `getCachedUserData` function is incomplete/broken (line 67-68)
3. Auth logic is mixed with resume logic inappropriately
4. No proper localStorage persistence for user sessions

## Proposed Changes

### 1. Remove getUserProfile dependency
- Remove import of `getUserProfile` from resume-operations
- Replace `fetchUserProfile` function with direct Supabase auth user metadata checking

### 2. Fix and improve caching system
- Replace broken `getCachedUserData` function
- Implement proper cache key checking (user profile existence check)
- Add localStorage persistence for user sessions
- Add cache validation with timestamps

### 3. Simplify auth flow
- Keep resume fetching in auth context (since it's user-specific auth state)
- Remove dependency on resume-operations for user profile
- Clean up the auth state management

### 4. Add missing functions
- Add `clearAuthCache` function that's referenced but missing
- Fix the AuthContextType interface

## Implementation Steps

1. **Remove getUserProfile import and related code**
   - Remove import from resume-operations
   - Replace `fetchUserProfile` function with direct user metadata checking
   - Remove `refreshUserProfile` function

2. **Implement proper cache functions**
   - Create `getCachedUserData` function
   - Create `clearAuthCache` function
   - Add cache key existence checking
   - Add localStorage session persistence

3. **Implement direct user profile checking**
   - Use `supabase.auth.getUser()` directly for user metadata
   - Check `has_resume` from user metadata instead of separate function

4. **Clean up and optimize**
   - Remove redundant code
   - Improve error handling
   - Add proper TypeScript types

## Files to Modify
- `/contexts/auth-context.tsx` - Main implementation
- Remove dependency on `/lib/database/resume-operations.ts` for getUserProfile

## Key Decisions
- Keep resume data fetching in auth context (since it's user-specific auth state)
- Use localStorage for session persistence
- Focus on auth-only functionality
- Rely on Supabase auth user metadata for has_resume status
- Maintain backward compatibility with existing context consumers

## Assumptions
- User metadata includes `has_resume` field
- localStorage is available in the browser environment
- Current cache key structure should be maintained