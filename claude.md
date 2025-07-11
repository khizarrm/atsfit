# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm start` - Start production server

### Build Notes
- ESLint and TypeScript errors are ignored during builds (see next.config.mjs)
- Images are unoptimized for deployment compatibility

## Project Architecture

### Core Technology Stack
- **Frontend**: Next.js 15 with React 19, TypeScript
- **UI Components**: Radix UI + shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: Zustand with persistence, Immer, and devtools
- **Authentication**: Supabase Auth with local caching
- **Database**: Supabase PostgreSQL
- **AI Integration**: OpenAI API for resume processing

### Application Structure

#### Main Application Flow
1. **Authentication**: Context-based auth with Supabase, cached in localStorage
2. **Resume Setup**: Users upload/input resume content
3. **ATS Processing**: OpenAI extracts keywords and scores resume
4. **Results Display**: Shows ATS score, matched/missing keywords, recommendations
5. **Resume Optimization**: AI rewrites resume based on job requirements

#### Key Directories
- `app/` - Next.js App Router pages and API routes
- `components/` - React components (UI components in `ui/` subdirectory)
- `stores/` - Zustand state management (auth, resume, UI slices)
- `lib/` - Utilities, database operations, API clients
- `contexts/` - React context providers (auth context)
- `hooks/` - Custom React hooks

#### State Management Architecture
- **Zustand stores** with separate slices for auth, resume, and UI state
- **Persistence** via localStorage with custom storage utilities
- **Immer integration** for immutable state updates
- **DevTools** support for debugging state changes

### Key Components & Services

#### Authentication System
- **Auth Context** (`contexts/auth-context.tsx`) - React context with caching
- **Auth Store** (`stores/slices/auth.ts`) - Zustand auth state
- **Supabase Client** (`lib/supabase.ts`) - Database connection
- **Resume Operations** (`lib/database/resume-operations.ts`) - Database queries

#### ATS Processing Pipeline
- **Current Implementation**: OpenAI API for keyword extraction and scoring
- **Keyword Extraction**: `/api/extract-keywords/route.ts` - GPT-3.5-turbo
- **ATS Scoring**: `lib/utils/ats-scorer.ts` - TypeScript implementation
- **Resume Conversion**: `/api/convert-resume/route.ts` - AI-powered formatting
- **PDF Generation**: `lib/api.ts` - HTML/CSS to PDF conversion

#### UI Architecture
- **Page Components**: Main views for each route
- **View Components**: Complex UI sections (profile-view, results-view, etc.)
- **Shared Components**: Reusable UI elements (shared-header, LoadingProgress)
- **shadcn/ui**: Consistent design system components

### Database Schema
- **Users**: Managed by Supabase Auth
- **Resumes**: User resume content stored as markdown
- **Keywords**: Extracted from job descriptions
- **ATS Scores**: Calculated matching scores

### Important Technical Details

#### State Persistence
- Auth state cached in localStorage for 24 hours
- Resume state persisted across sessions
- UI preferences maintained in local storage

#### API Integration
- OpenAI API calls for keyword extraction and resume optimization
- Supabase for user authentication and data storage
- Custom API routes for processing workflows

#### Python Backend (Currently Unused)
- Advanced ATS processing scripts exist in `/app/` directory
- Includes sophisticated keyword extraction, scoring, and section parsing
- Not integrated with current TypeScript implementation
- Could be used for offline processing or to reduce API costs

### Development Workflow

#### Planning Requirements
- Create `plan.md` for significant features
- Break down complex tasks into steps
- Seek approval before implementation
- Document assumptions and decisions

#### Code Standards
- Follow existing TypeScript/React patterns
- Use established UI components from shadcn/ui
- Maintain consistent state management patterns
- Implement proper error handling and loading states

#### Testing & Deployment
- Build process ignores lint/type errors (configured for rapid iteration)
- Deployment via Netlify with custom configuration
- Environment variables required for Supabase and OpenAI