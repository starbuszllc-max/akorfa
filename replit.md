# Akorfa Platform

## Overview

Akorfa is a monorepo-based web and mobile platform for human development assessment and social engagement. The system enables users to:

- Complete 7-layer self-assessments (environment, biological, internal, cultural, social, conscious, existential)
- Calculate system stability metrics using a proprietary formula
- Participate in a social feed with posts, reactions, and comments
- Track personal growth through an Akorfa scoring system
- View and manage assessment data through an admin interface

The platform uses a shared scoring engine (`@akorfa/shared`) consumed by both web (Next.js) and mobile (Expo/React Native) applications, with a PostgreSQL database for data persistence.

## Recent Changes (December 2025)

### Phase 1: Modernization
- **Dark Mode**: Full dark mode support with system preference detection and manual toggle
- **Lazy Database Initialization**: DATABASE_URL is only required at runtime (using Proxy pattern)
- **Lazy OpenAI Initialization**: OpenAI client uses lazy loading to avoid build-time errors
- **Updated Auth Flow**: Replaced Supabase client auth with localStorage-based demo auth
- **New Onboarding Flow**: 4-step personalized onboarding (name, goals, focus layers, completion)
- **Gamification Schema**: Added user_streaks, user_levels, groups, daily_insights tables
- **AI Coach**: Voice-enabled AI coach with fallback when OpenAI not configured
- **Leaderboard**: Real-time leaderboard showing top users by Akorfa score
- **Groups/Communities**: Community groups feature for social engagement
- **Daily Insights**: AI-generated personalized daily insights

### Phase 2: Responsive Design (December 2025)
- **Compact Hero Section**: Reduced padding (py-10 md:py-14), responsive text sizes
- **Compact Navigation**: Smaller logo, tighter padding, icon-only on medium screens
- **Compact Cards**: Reduced padding (p-4 md:p-5), smaller gaps (gap-4 md:gap-5)
- **Responsive Layout**: Tighter container (max-w-5xl), responsive padding (px-3 sm:px-4 lg:px-6)
- **Fixed Comment Button**: Changed color from bg-primary to bg-indigo-600 for visibility
- **Database Schema Migration**: Migrated from Supabase migrations to Drizzle ORM schema

### Phase 3: Insight School (December 2025)
- **Learning Tracks**: 4 tracks with full lesson content (Human Behavior OS, Social Systems OS, Leadership OS, Stability Equation)
- **AI-Powered Learning**: "Deepen this idea" feature explains concepts in simpler terms using AI mentor
- **Interactive Q&A**: Users can ask questions about lesson content with session continuity
- **Progress Tracking**: Lesson completion tracked in localStorage, shown on main Insight School page
- **Anonymous User Support**: Auto-generates user ID for visitors without accounts

### Key Files Changed
- `web/app/insight-school/[slug]/page.tsx` - Track detail page with lessons and AI features
- `web/app/insight-school/page.tsx` - Main Insight School page with progress tracking
- `web/app/api/ai-mentor/route.ts` - AI mentor API for learning assistance
- `web/lib/db.ts` - Lazy database initialization with Proxy pattern
- `web/lib/openai.ts` - Lazy OpenAI client initialization
- `web/lib/ThemeContext.tsx` - Dark mode context provider
- `web/app/onboarding/page.tsx` - New onboarding flow
- `web/app/insights/page.tsx` - Daily insights page
- `web/app/leaderboard/page.tsx` - Leaderboard page
- `web/app/groups/page.tsx` - Communities page
- `web/components/VoiceCoach.tsx` - Voice AI coach component
- `web/app/page.tsx` - Responsive homepage with compact design
- `web/components/ui/Header.tsx` - Compact navigation header
- `web/components/ui/Footer.tsx` - Compact footer
- `web/app/layout.tsx` - Responsive layout container
- `web/components/feed/PostCard.tsx` - Compact post cards with fixed comment button

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure

**Decision**: Use npm workspaces to share code between web, mobile, and shared packages.

**Rationale**: A single repository simplifies dependency management and enables the shared scoring logic to be imported by both web and mobile clients without publishing to npm. The `@akorfa/shared` package contains TypeScript types and deterministic scoring functions that must remain consistent across platforms.

**Implementation**: The root `package.json` defines workspaces for `shared/`, `web/`, `mobile/`, and `supabase/`. The shared package is built via `npm run build:shared` before the web app starts.

### Frontend Architecture (Web)

**Decision**: Next.js 15 App Router with React Server Components and client components.

**Rationale**: App Router enables server-side rendering, streaming, and simplified data fetching. Client components (`"use client"`) handle interactive forms (assessments, stability calculator, post composer) while server components handle static layouts and initial data loading.

**Key patterns**:
- Dynamic imports for client-heavy components to reduce initial bundle size
- Tailwind CSS for utility-first styling with custom theme (primary indigo, secondary green)
- Dark mode support via ThemeContext and Tailwind dark: variants
- Reusable UI components (`Button`, `Card`, `Header`) following atomic design principles
- Route groups (`(auth)`) for authentication pages without affecting URL structure
- Lazy initialization patterns for database and OpenAI to avoid build-time errors

### Backend Architecture (API Routes)

**Decision**: Next.js API routes (Route Handlers) for server-side logic with PostgreSQL database.

**Rationale**: Collocating API routes with the frontend simplifies deployment and enables type-safe server actions.

**Key endpoints**:
- `POST /api/assessments` — Persists 7-layer scores and computes overall Akorfa score
- `POST /api/stability` — Calculates and stores stability metrics
- `POST /api/posts` — Creates posts, user events, and updates user scores
- `POST /api/reactions` — Creates reactions and increments post like counts
- `POST /api/ai-coach` — AI-powered coaching with OpenAI (with fallback)
- `GET /api/insights` — AI-generated daily insights
- `POST /api/insights/generate` — Generate and store new daily insight
- `GET /api/leaderboard` — Top users by Akorfa score
- `GET /api/groups` — Community groups list
- `POST /api/groups/join` — Join a community group
- `POST /api/onboarding` — Complete user onboarding

**Scoring integration**: Each API route imports the shared scoring engine (`@akorfa/shared/src/scoring`) to compute deltas.

### Authentication & Authorization

**Current State**: Demo auth using localStorage for simplified development flow.

**Implementation**:
- `demo_user_id` stored in localStorage
- Onboarding flow creates user profile
- Dashboard and other pages check for demo_user_id

**Future**: Can be upgraded to full Supabase Auth or other providers.

### Data Model

**Decision**: Postgres with Drizzle ORM and normalized relational schema.

**Core Tables**:
- `profiles` — User profile with `akorfa_score`, `username`, `bio`, gamification fields
- `assessments` — 7-layer assessment records with `layer_scores` (JSONB) and `overall_score`
- `posts` — Feed posts with `content`, `layer`, `like_count`, `comment_count`
- `reactions` — Post reactions (many-to-many between users and posts)
- `comments` — Post comments
- `user_events` — Activity log for scoring

**Gamification Tables** (New):
- `user_levels` — Level definitions with XP requirements
- `daily_insights` — AI-generated daily insights per user
- `groups` — Community groups/communities

**Rationale**: JSONB for `layer_scores` enables flexible schema evolution. Drizzle ORM provides type-safe queries.

### Shared Scoring Logic

**Decision**: Pure TypeScript functions in `@akorfa/shared` with deterministic output.

**Core functions**:
- `calculateAkorfaScore(input: AkorfaActivityInput): number` — Computes user score from activity metrics
- `calculateStability(metrics: StabilityMetrics): number` — Implements stability equation

**Import Path**: Use `@akorfa/shared/src/scoring` for development compatibility.

**Scoring rules** (hardcoded weights):
- Post created: 5 points
- Comment added: 2 points
- Reaction received: 1 point
- Assessment completed: 10 points
- Challenge completed: 15 points
- Streak bonus: 2 points per day (capped at 20)

## External Dependencies

### PostgreSQL Database

**Purpose**: Primary data storage for all platform data.

**Configuration**:
- Connection via `DATABASE_URL` environment variable
- Lazy initialization to avoid build-time errors
- Drizzle ORM for type-safe queries

### OpenAI (Optional)

**Purpose**: AI-powered insights, coaching, and content generation.

**Configuration**:
- API key via `OPENAI_API_KEY` environment variable
- Lazy initialization with fallback content when not configured
- Uses `gpt-4o-mini` model for cost efficiency

### Next.js 15

**Purpose**: React framework with App Router, server components, and API routes.

**Key features used**:
- App Router for file-based routing
- Server and client components for optimal rendering
- Route Handlers for API endpoints
- Dynamic imports for code splitting

### Tailwind CSS

**Purpose**: Utility-first CSS framework with dark mode support.

**Customization**: Extended theme with Akorfa brand colors and dark mode variants.
- Dark mode: `dark:` prefix classes
- Theme toggle via ThemeContext

### TypeScript

**Purpose**: Type safety across web, mobile, and shared packages.

**Configuration**: Strict mode enabled. Shared package provides type declarations.

### Lucide React

**Purpose**: Icon library for modern, consistent iconography throughout the app.

## Running the Application

1. **Development**: `cd web && npm run dev` (runs on port 5000)
2. **Build**: `npm run build:shared && cd web && npm run build`
3. **Required Environment Variables**:
   - `DATABASE_URL` - PostgreSQL connection string
   - `OPENAI_API_KEY` - OpenAI API key (optional, for AI features)

## Project Structure

```
/
├── shared/           # Shared TypeScript package (@akorfa/shared)
│   └── src/
│       ├── schema.ts # Drizzle database schema
│       └── scoring/  # Scoring logic
├── web/              # Next.js 15 web application
│   ├── app/          # App Router pages and API routes
│   ├── components/   # Reusable UI components
│   ├── lib/          # Utility functions and context
│   └── styles/       # Global CSS and Tailwind config
├── mobile/           # Expo React Native app (placeholder)
└── supabase/         # Database migrations
```
