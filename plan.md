# Authentication Flow Restructure Plan

## Current Problem
The dashboard is shown as the main view when the page initially loads, but it should show the login page first and only navigate to dashboard after successful authentication.

## Requirements Understanding
- Default view should be login page
- Dashboard should only be accessible after authentication
- Need to check authentication state and route accordingly

## Current Architecture Analysis
After reviewing the code, I can see:
- `app/page.tsx` is the main entry point that starts with `currentState="dashboard"`
- `app/login/page.tsx` is a separate login page with its own modals
- `contexts/auth-context.tsx` manages authentication state
- The main app redirects to `/login` only when no user is found

## Step-by-Step Approach

### 1. Modify Main App Entry Point
- Change `app/page.tsx` to default to login page initially
- Check authentication in the background
- Only navigate to dashboard/resume-setup after confirming user is logged in

### 2. Update Initial State Logic
- Remove the default `currentState="dashboard"` 
- Default to showing login page immediately
- Modify the useEffect to handle the flow: login page → (auth check in background) → dashboard/resume-setup if authenticated

### 3. Improve User Experience
- Show login page immediately (no loading state)
- Check auth in background without blocking UI
- Smooth transition to dashboard once auth is confirmed
- Prevent flash of dashboard content for unauthenticated users

### 4. Test the Flow
- Test initial page load shows login page for unauthenticated users
- Test successful login redirects to dashboard
- Test logout returns to login page
- Test refresh behavior maintains proper state

## Files to be Modified
- `app/page.tsx` - Main entry point logic (primary change)
- No changes needed to `app/login/page.tsx` (it's already well-structured)
- No changes needed to `contexts/auth-context.tsx` (auth logic is solid)

## Key Implementation Details
- Change the routing logic to show login page by default instead of dashboard
- Remove redirect to `/login` route - instead show login page directly in main app
- Update the useEffect logic to check authentication in background
- When authenticated, transition directly to dashboard/resume-setup

## Expected Behavior After Changes
1. Page loads → Shows login page immediately
2. Auth check happens in background
3. If authenticated but no resume → Transitions to resume setup
4. If authenticated with resume → Transitions to dashboard
5. If not authenticated → User stays on login page (already there)

This approach maintains the existing login page design while fixing the initial routing issue.