# MyTime — Workday Manager

## Overview
Next.js 14 (App Router) time-tracking and workday management SaaS. PostgreSQL + Prisma ORM. Tailwind CSS + shadcn/ui components.

## Tech Stack
- **Framework:** Next.js 14, App Router, TypeScript
- **Database:** PostgreSQL, Prisma ORM (`prisma/schema.prisma`)
- **Auth:** NextAuth.js v5 (credentials provider, JWT sessions)
- **UI:** Tailwind CSS, shadcn/ui (`src/components/ui/`)
- **Payments:** Stripe (checkout, webhooks, portal)
- **Email:** Resend

## Project Structure
- `src/app/(app)/` — Authenticated app pages (schedule, clients, tasks, timer, etc.)
- `src/app/api/` — API routes (one folder per domain)
- `src/components/layout/` — Sidebar, header, clock, timer
- `src/components/ui/` — shadcn/ui primitives (Button, Card, Dialog, etc.)
- `src/lib/` — Shared utilities (auth, db, helpers)
- `prisma/schema.prisma` — Database schema

## Key Patterns
- API routes use `getAuthUser()` from `src/lib/auth-utils.ts` for authentication
- Role hierarchy: owner > admin > manager > user
- Plan hierarchy: business > pro > starter > free
- Client components use `"use client"` directive
- State fetched via `fetch("/api/...")` in useEffect/useCallback hooks
- No Redux or state management library — local state + API calls

## Integrations
- **Slack** — OAuth, messages (src/app/api/slack/)
- **Gmail** — OAuth, email inbox (src/app/api/gmail/)
- **Outlook** — OAuth, email inbox (src/app/api/outlook/)
- **Notion** — API token, page browsing (src/app/api/notion/)
- **ClickUp/Trello/Asana/Monday** — API tokens, task triage (src/app/api/{service}/)

## Conventions
- Prefer editing existing files over creating new ones
- Keep changes minimal and focused
- Use existing shadcn/ui components from `src/components/ui/`
- API routes return `NextResponse.json()`
- Don't add comments, docstrings, or type annotations unless asked
