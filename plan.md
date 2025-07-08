# Page Structure Refactoring Plan

## Current Problem
The app currently uses a single page with view switching via state management. We need to restructure to use proper Next.js pages routing, starting with moving the resume setup view to its own page.

## Requirements Understanding
- Convert from view-based state management to Next.js page routing
- Create separate page for resume setup view
- Maintain authentication flow but use proper routing
- Keep login page as default for unauthenticated users

## Current Architecture Analysis
After reviewing the code, I can see:
- `app/page.tsx` uses state management with `renderView()` function
- Components: `DashboardView`, `ResumeSetupView`, `LoginPage`
- `app/login/page.tsx` exists as separate page
- `contexts/auth-context.tsx` manages authentication state
- Currently using `currentState` to switch between views

## Step-by-Step Approach

### 1. Create Resume Setup Page
- Create `app/resume-setup/page.tsx` 
- Move `ResumeSetupView` component logic to this new page
- Update navigation to use `router.push()` instead of state changes

### 2. Update Main App Routing Logic
- Modify `app/page.tsx` to handle routing instead of view switching
- Remove `renderView()` function and state-based navigation
- Use Next.js router for navigation between pages

### 3. Update Authentication Flow
- Keep login page as default in main app
- Navigate to `/resume-setup` when user has no resume
- Navigate to `/dashboard` (or stay on main page) when user has resume
- Handle logout to return to login page

### 4. Update Component Navigation
- Update `ResumeSetupView` callbacks to use router navigation
- Update `DashboardView` callbacks to use router navigation
- Remove state-based navigation from components

### 5. Test the New Flow
- Test initial page load shows login page
- Test successful login navigates to appropriate page
- Test resume setup completion navigates to dashboard
- Test navigation between pages works correctly

## Files to be Created/Modified

### New Files
- `app/resume-setup/page.tsx` - New page for resume setup functionality

### Modified Files
- `app/page.tsx` - Remove state-based view switching, add router-based navigation
- `components/resume-setup-view.tsx` - Update callbacks to use router navigation
- `components/dashboard-view.tsx` - Update callbacks to use router navigation

### No Changes Needed
- `app/login/page.tsx` - Already structured as separate page
- `contexts/auth-context.tsx` - Auth logic remains solid

## Key Implementation Details
- Create dedicated `/resume-setup` page route
- Update authentication flow to use `router.push()` instead of `setState()`
- Remove `currentState` management from main app
- Update component callbacks to navigate between pages
- Maintain login page as default for unauthenticated users

## Expected Behavior After Changes
1. Page loads → Shows login page immediately
2. Auth check happens in background
3. If authenticated but no resume → Navigates to `/resume-setup`
4. If authenticated with resume → Shows dashboard (stays on main page)
5. If not authenticated → User stays on login page
6. Resume setup completion → Navigates back to `/` (dashboard)

This approach uses proper Next.js routing while maintaining the existing authentication flow.