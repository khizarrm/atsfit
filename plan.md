# Fix SSR localStorage/sessionStorage Errors

## Problem
The app is throwing `ReferenceError: sessionStorage is not defined` and `ReferenceError: localStorage is not defined` during server-side rendering (SSR) because these browser APIs are not available on the server.

## Root Cause
The Zustand stores in `stores/index.ts` are trying to access `localStorage` and `sessionStorage` during SSR at lines 28, 73, and 118.

## Solution Approach
1. **Examine the current store implementation** ✓ - Found 3 stores with custom storage implementations
2. **Add proper SSR guards** to check if we're in a browser environment before accessing storage APIs
3. **Implement fallback behavior** for server-side rendering
4. **Test the fix** to ensure it works correctly

## Implementation Steps
1. Read `stores/index.ts` to understand the current storage implementation ✓
2. Add `typeof window !== 'undefined'` checks before accessing storage APIs
3. Provide fallback values for SSR (return null or empty state)
4. Verify the fix resolves the errors

## Files to Modify
- `stores/index.ts` - Add SSR guards for storage access

## Technical Details
- `useAuthStore` uses `sessionStorage` (lines 28, 37, 44)
- `useResumeStore` uses `localStorage` (lines 73, 82, 89)
- `useUIStore` uses `localStorage` (lines 118, 127, 134)

## Expected Outcome
- No more SSR errors related to localStorage/sessionStorage
- App continues to work correctly in the browser
- Proper fallback behavior during SSR