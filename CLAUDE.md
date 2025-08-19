# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Fitness Workout Generator - A Next.js web application that creates personalized fitness programs using OpenAI integration. The app manages clients, generates AI-powered workout programs, and tracks exercise progression.

## Development Commands

### Core Development

```bash
pnpm dev          # Start development server with Turbopack
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint checks
pnpm check-types  # TypeScript type checking
pnpm format:fix   # Format code with Prettier
```

### Testing

```bash
pnpm test         # Run Vitest tests
pnpm test:ui      # Run tests with UI
pnpm test:run     # Run tests once (CI mode)
```

### Database Operations

```bash
pnpm staging-types  # Generate Supabase types from staging
pnpm local-types    # Generate Supabase types from local
pnpm openstudio     # Open Supabase Studio locally (http://localhost:54323)
pnpm openemail      # Open local email service (http://localhost:54324)
```

### Custom Tooling

```bash
pnpm ctl           # Custom development CLI tool
```

## Architecture

### Tech Stack

- **Framework**: Next.js 15.4.4 with App Router and Turbopack
- **Database**: Supabase (PostgreSQL) with type-safe operations
- **AI**: OpenAI API for workout generation (via @ai-sdk/openai)
- **Styling**: Tailwind CSS + shadcn/ui (New York style)
- **State**: Zustand stores + Server Actions
- **Forms**: React Hook Form + Zod validation with next-safe-action
- **Auth**: Supabase Auth with SSR support
- **Testing**: Vitest with UI testing capabilities
- **UI**: shadcn/ui with Radix UI primitives + custom components

### Directory Structure

- `src/app/` - Next.js App Router with route groups (`/home`, `/clients`, `/auth`)
- `src/actions/` - React Server functions to handle API requests.
- `src/components/` - Reusable UI components using shadcn/ui
- `src/lib/` - Core utilities, database operations, AI logic
  - `supabase/` - Database client and server operations
  - `ai/` - OpenAI integration and workout prompts
  - `types/` - TypeScript type definitions
- `supabase/` - Database schema, migrations, and seed data

### Key Patterns

**Database Layer**: All database operations use type-safe Supabase client with generated types. Server Actions handle mutations while Server Components fetch data directly. Use `pnpm staging-types` to regenerate types after schema changes.

**AI Integration**: OpenAI calls are centralized in `lib/ai/` with structured prompts for fitness expertise. Workout generation considers client profiles, goals, and exercise preferences.

**Component Architecture**: Uses shadcn/ui design system (New York style) with custom components in `components/ui/`. Form components integrate React Hook Form with Zod validation schemas.

**Routing**: Next.js App router routing.

## Important Files

### Configuration

- `next.config.js` - Next.js configuration.
- `tailwind.config.js` - Design tokens, custom animations
- `components.json` - shadcn/ui configuration

## Development Workflows

### Making a DB schema change
1. Make changes to `20230727214151_db_schema_initial.sql`.

### Working with AI Features

AI workout generation requires:

- Client profile data (goals, experience, equipment)
- Exercise database with proper categorization
- Structured prompts in `lib/ai/prompts/`
- Error handling for API rate limits

### Database Changes

Always create migrations for schema changes:

```bash
npx supabase migration new migration-name
# Edit the migration file
npx supabase db reset  # Test locally
```

## Code Conventions

### Core Principles

- Use Server Actions for mutations, not API routes
- Import server-only modules with `server-only` package
- Follow shadcn/ui component patterns for consistency
- Use Zod schemas for all form validation
- Keep AI prompts in dedicated files for maintainability
- Database queries use the generated types from Supabase

### Component Development

- Use `const` instead of `function` declarations for components
- Event handlers should be prefixed with "handle" (e.g., `handleClick`, `handleKeyDown`)
- Use descriptive variable and function names
- Implement accessibility features on interactive elements
- Use Tailwind classes exclusively for styling; avoid CSS or style tags
- Use early returns to improve code readability

### Accessibility Requirements

- Add `tabindex="0"` to interactive non-button elements
- Include `aria-label` attributes where appropriate
- Pair `onClick` with `onKeyDown`/`onKeyUp` handlers
- Accompany `onMouseOver`/`onMouseOut` with `onFocus`/`onBlur`
- Ensure proper heading hierarchy and semantic HTML

### TypeScript Standards

- Define types for all component props and function parameters
- Use `export type` for type-only exports
- Avoid `any` type; use proper typing
- Don't use TypeScript enums; prefer const objects or union types
- Use `as const` for immutable data structures
