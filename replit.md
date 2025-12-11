# Akorfa Platform

## Overview
Akorfa is a monorepo-based web and mobile platform for human development assessment and social engagement. It enables users to complete 7-layer self-assessments, calculate system stability, participate in a social feed, track personal growth via an Akorfa scoring system, and manage data through an admin interface. The platform features an AI Coach, personalized daily insights, a TikTok-style video feed, verified news, and an Insight School with AI-powered learning tracks. Its business vision is to provide a comprehensive tool for personal growth and community interaction, leveraging AI and a robust social platform.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The project uses an npm workspaces monorepo structure, enabling code sharing between the web (Next.js), mobile (Expo/React Native placeholder), and a shared package (`@akorfa/shared`). The `shared` package contains TypeScript types and deterministic scoring functions, ensuring consistency across platforms.

### Frontend Architecture (Web)
The web application is built with Next.js 15's App Router, leveraging React Server Components for static layouts and initial data loading, and client components for interactive elements like assessments and post composers. Key patterns include dynamic imports, Tailwind CSS for styling with dark mode support, and reusable UI components. Lazy initialization is used for database and OpenAI clients.

### Backend Architecture (API Routes)
Next.js API routes (Route Handlers) manage server-side logic and interact with a PostgreSQL database. This co-location simplifies deployment and enables type-safe server actions. API routes handle assessments, stability calculations, post creation, reactions, AI coaching, daily insights, leaderboards, group management, onboarding, personalized video feeds, and news articles.

### Authentication & Authorization
The platform uses Supabase Auth for real email/password authentication. Users can sign up with their email, receive confirmation emails, and log in securely. Session management is handled via Supabase's SSR package with middleware integration. The auth flow includes proper handling of email confirmation requirements.

### Media Storage
Media uploads (photos and videos) are stored in Supabase Storage for cloud-based persistence. The upload API handles file validation and returns public URLs that are saved with posts. Users can attach up to 4 media files per post. **Important**: An "uploads" bucket must be created in the Supabase dashboard with public access enabled for media URLs to work.

### Data Model
The data model utilizes PostgreSQL with Drizzle ORM, employing a normalized relational schema. Core tables include `profiles`, `assessments`, `posts`, `reactions`, and `comments`. Gamification features are supported by `user_levels`, `daily_insights`, and `groups`. Video and news content are integrated via enhanced `posts` and new `news_sources`, `news_articles` tables.

### Shared Scoring Logic
The `@akorfa/shared` package contains pure TypeScript functions for deterministic scoring calculations, such as `calculateAkorfaScore` and `calculateStability`. These functions are imported and used by API routes to compute user scores based on various activities.

## External Dependencies

*   **PostgreSQL Database**: Primary data storage, configured via `DATABASE_URL`, using Drizzle ORM.
*   **Supabase Auth**: Real email/password authentication with email confirmation, configured via `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
*   **Supabase Storage**: Cloud-based media storage for photos and videos. Requires an "uploads" bucket to be created in Supabase dashboard.
*   **OpenAI**: Provides AI-powered insights, coaching, and content generation, configured via `OPENAI_API_KEY` (optional, with fallback). Uses `gpt-4o-mini`.
*   **Next.js 15**: React framework, utilizing App Router, Server Components, Client Components, and API routes.
*   **Tailwind CSS**: Utility-first CSS framework with custom theme and dark mode support.
*   **TypeScript**: Ensures type safety across the entire monorepo.
*   **Lucide React**: Icon library for consistent iconography.