# Plan: Convert Dashboard View to Its Own Page

## Current State Analysis
- **Current Structure**: The dashboard view is implemented as a component (`DashboardView`) in `/components/dashboard-view.tsx`
- **Current Routing**: The main `page.tsx` handles routing between login and dashboard states using a state machine approach
- **Current Flow**: Login → Dashboard view (rendered conditionally in main page) → Results view

## Proposed Changes

### 1. Create New Dashboard Page
- Create `/app/dashboard/page.tsx` as a dedicated dashboard page
- Move the dashboard logic from the main page component to this new page
- This page will contain all the dashboard functionality currently in `DashboardView`

### 2. Update Main Page
- Simplify `/app/page.tsx` to primarily handle authentication and routing
- Remove the dashboard state from the main page state machine
- Redirect authenticated users with resumes to `/dashboard` instead of showing dashboard inline

### 3. Update Navigation Flow
- Modify authentication logic to redirect to `/dashboard` when user has a resume
- Update any internal navigation that currently calls dashboard state changes to use Next.js routing
- Ensure proper back/forward navigation works with browser history

### 4. Update Components
- Keep `DashboardView` component but adapt it for standalone page usage
- Remove or modify props that were specific to the state machine approach
- Update the `SharedHeader` and other components to work with the new routing

### 5. Maintain Existing Functionality
- Preserve all existing dashboard features (resume optimization, ATS scoring, etc.)
- Keep the same UI/UX experience
- Ensure proper error handling and loading states

## Files to Modify

1. **Create**: `/app/dashboard/page.tsx` - New dashboard page
2. **Modify**: `/app/page.tsx` - Simplify main page routing
3. **Modify**: `/components/dashboard-view.tsx` - Adapt for standalone page usage
4. **Modify**: `/contexts/auth-context.tsx` - Update any routing logic if needed

## Implementation Steps

1. Create the new dashboard page structure
2. Move dashboard logic from main page to new dashboard page
3. Update main page to redirect to dashboard route
4. Test authentication flow and navigation
5. Ensure all existing functionality works correctly

## Benefits
- **Better URL Structure**: Users can bookmark `/dashboard` directly
- **Improved Navigation**: Browser back/forward buttons work properly
- **Cleaner Code**: Separation of concerns between authentication and dashboard
- **Better SEO**: Each page has its own route and can be optimized independently

## Considerations
- Ensure authentication guards are properly in place for the dashboard route
- Maintain existing error handling and loading states
- Preserve all existing functionality and UI behavior
- Test thoroughly to ensure no regressions in user experience