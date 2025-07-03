# Try-It Functionality Implementation Plan

## Current State Analysis
- **Main App Flow**: `app/page.tsx` → `LoginView` → `TryItView` → `DashboardView`
- **Try-It View**: Currently expects file upload, but needs to be modified for resume pasting
- **Dashboard View**: Full-featured optimization flow for authenticated users
- **Upload View**: Has resume pasting functionality that can be adapted

## Requirements
1. **3-Attempt Limit**: Non-authenticated users can only try 3 times
2. **Resume Pasting**: Users paste resume instead of uploading files
3. **Same Flow**: Use existing optimization flow but without profile/settings
4. **ChatGPT Prompt**: Include the ChatGPT prompt for users who want to try elsewhere

## Implementation Strategy

### Phase 1: Trial Session Management
**Files to modify:**
- `lib/utils/trial-manager.ts` (NEW)
- `contexts/trial-context.tsx` (NEW)

**Features:**
- LocalStorage-based attempt tracking
- Session persistence across browser refreshes
- 3-attempt limit enforcement
- Trial expiration handling

### Phase 2: Enhanced Try-It View
**Files to modify:**
- `components/try-it-view.tsx` (MAJOR UPDATE)

**Changes:**
- Replace file upload with resume paste textarea
- Add attempt counter display
- Add ChatGPT prompt modal/section
- Integrate with trial manager
- Simplified UI without profile features

### Phase 3: Trial Results View
**Files to modify:**
- `components/trial-results-view.tsx` (NEW)
- `components/results-view.tsx` (REFERENCE)

**Features:**
- Simplified results without save/profile options
- Prominent "Create Account" CTA
- Show remaining attempts
- ChatGPT prompt copy button

### Phase 4: App Flow Updates
**Files to modify:**
- `app/page.tsx` (MINOR UPDATE)
- `components/login-view.tsx` (MINOR UPDATE)

**Changes:**
- Add trial context provider
- Handle trial mode state properly
- Integrate attempt tracking

## Technical Implementation Details

### 1. Trial Manager (`lib/utils/trial-manager.ts`)
```typescript
interface TrialSession {
  attempts: number;
  maxAttempts: number;
  lastAttempt: Date;
  sessionId: string;
}

export class TrialManager {
  private static readonly STORAGE_KEY = 'atsfit_trial_session';
  private static readonly MAX_ATTEMPTS = 3;
  
  static getSession(): TrialSession
  static incrementAttempt(): boolean
  static getRemainingAttempts(): number
  static resetSession(): void
  static isTrialExpired(): boolean
}
```

### 2. Enhanced Try-It View Structure
```typescript
interface TryItViewProps {
  onJobSubmit: (description: string) => void;
  onBack: () => void;
  onSignUp: () => void;
  isTrialMode: boolean;
}

// New sections to add:
- Trial attempt counter
- Resume paste textarea (like UploadView)
- ChatGPT prompt section
- Attempt limit warnings
```

### 3. ChatGPT Prompt Integration
**Location:** Modal/collapsible section in TryItView
**Content:** Pre-formatted prompt that users can copy to use in ChatGPT
**Features:**
- One-click copy functionality
- Instructions for using the prompt
- Fallback option when trial limit reached

### 4. Trial Results View
**Simplified version of ResultsView with:**
- Resume display (read-only)
- Basic ATS score
- No save/export options
- Prominent signup CTA
- Remaining attempts display

## User Experience Flow

### New User Journey:
1. **Landing Page** → Click "Try It Free"
2. **Try-It View** → See attempt counter (3/3 remaining)
3. **Paste Resume** → Text area with markdown formatting
4. **Paste Job Description** → Same as current flow
5. **Submit** → Decrement attempt counter
6. **Results** → Simplified results with signup CTA
7. **Back to Try-It** → Now shows (2/3 remaining)
8. **Repeat** → Until 0 attempts left
9. **Limit Reached** → Show ChatGPT prompt + signup CTA

### Attempt Exhausted State:
- Block the optimization button
- Show "Trial limit reached" message
- Offer ChatGPT prompt as alternative
- Prominent "Create Account" button
- Show benefits of full account

## Security Considerations
- Client-side trial tracking (can be bypassed but acceptable for trial)
- No server-side storage for trial users
- Rate limiting still applies to API calls
- Trial data not persistent across devices

## Error Handling
- localStorage unavailable fallback
- API failures don't count against attempts
- Session corruption recovery
- Browser compatibility checks

## Testing Strategy
- Test attempt counter accuracy
- Test localStorage persistence
- Test trial expiration
- Test ChatGPT prompt functionality
- Test signup flow integration

## Performance Considerations
- Minimal overhead for trial tracking
- No additional API calls for trial management
- Efficient localStorage usage
- Optimized re-renders for attempt counter

## Future Enhancements
- Trial session analytics
- A/B testing for trial limits
- Enhanced ChatGPT prompt templates
- Trial user conversion tracking

## Timeline
- **Phase 1**: Trial management system (2 hours)
- **Phase 2**: Enhanced Try-It View (4 hours)
- **Phase 3**: Trial Results View (3 hours)
- **Phase 4**: App flow integration (1 hour)
- **Testing & Polish**: (2 hours)

**Total Estimated Time**: 12 hours

## Dependencies
- Existing API endpoints (no changes needed)
- Current UI components (Button, Textarea, etc.)
- Existing optimization flow (reuse with modifications)
- Current auth system (for signup flow)

## Success Metrics
- Trial completion rate
- Conversion from trial to signup
- User engagement with ChatGPT prompt
- Average attempts per trial session

---

**Key Decision Points:**
1. ✅ Use localStorage for trial tracking (simple, effective)
2. ✅ 3-attempt limit (reasonable for trial)
3. ✅ Resume pasting instead of file upload (better UX)
4. ✅ Include ChatGPT prompt (value-add for blocked users)
5. ✅ Simplified results view (focus on core value)

**Next Steps:**
1. Get approval for this plan
2. Implement Phase 1 (trial management)
3. Update Try-It View for resume pasting
4. Create simplified results view
5. Integrate everything and test