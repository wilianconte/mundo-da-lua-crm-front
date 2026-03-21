---
name: dev-admin
description: Enforce the official front-end architecture for Mundo da Lua CRM. Use when working on the CRM front-end, proposing UI architecture, creating screens or components, structuring Next.js code, defining GraphQL integration, or reviewing whether a front-end change follows the project's required standards for Next.js, App Router, Tailwind CSS, GraphQL, accessibility, responsiveness, and performance.
---

# Dev Admin

Use this skill as the default implementation guide for front-end work in Mundo da Lua CRM.

## Quick Start

1. Read `references/dev-admin.md` before making architectural or structural decisions.
2. Treat the reference as the source of truth when local opinions conflict.
3. Keep new work aligned with the official stack:
   - `Next.js`
   - `App Router`
   - `TypeScript`
   - `Tailwind CSS`
   - `GraphQL` as the only data interface
   - `Server Components` by default
   - `React Hook Form` + `Zod` for forms
4. Prefer existing design-system patterns over inventing new visual conventions.

## Execution Rules

- Default to `Server Components`; move to `Client Components` only for real interactivity or browser-only APIs.
- Organize by business domain, not only by technical layer.
- Keep GraphQL operations close to their feature.
- Do not place GraphQL or business rules inside generic `ui` components.
- Treat accessibility, loading, error, empty, responsive behavior, and performance as implementation requirements.
- Avoid introducing duplicate state layers, visual systems, or overlapping UI libraries.

## What To Check Before Implementing

Confirm:

- which module or business domain is being changed
- whether the route should be a `Server Component` or `Client Component`
- which GraphQL contract or schema fragment will be used
- whether the design system already has a reusable component for the job
- which tenant and permission rules affect the flow
- which `loading`, `empty`, `error`, and `success` states are needed
- what the mobile/tablet/desktop behavior should be

## What To Check Before Finishing

Confirm:

- no parallel design pattern was introduced
- no unnecessary global state was added
- no business rule was duplicated in the front end
- accessibility basics are covered
- loading, empty, and error states exist where needed
- feature structure follows the domain-oriented model
- performance impact is still reasonable

## Reference Guide

Read `references/dev-admin.md` for:

- mandatory architectural decisions
- project structure and feature organization
- component layering rules
- design system and UX rules
- responsive behavior
- GraphQL, auth, authorization, and multi-tenant rules
- Next.js implementation standards
- code conventions
- performance, accessibility, testing, and quality gates
- forbidden anti-patterns
## Bootstrap Directives

When bootstrapping a new admin front for Mundo da Lua CRM:

- create the project in a dedicated front-end folder and keep it isolated from the backend solution
- use a configurable token-based theme from the first commit
- define at least `--color-primary` and `--color-secondary` plus surface, border, text, radius, shadow, and motion tokens
- treat the initial product as an admin panel, not a marketing site
- implement a responsive sidebar with support for nested navigation levels
- provide a polished login screen and an authenticated home/dashboard as the first two routes
- include a `/components` or equivalent showcase area to document the first reusable UI primitives
- prefer light-theme operational density with modern surfaces, strong hierarchy, and fast scanning
- keep the first shell ready for future tenant branding without allowing arbitrary visual drift

## Knowledge To Preserve

- the first front-end bootstrap lives in `mundo-da-lua-front`
- the initial theme palette uses blue as primary and teal as secondary through CSS tokens
- the admin shell already establishes sidebar, mobile drawer, topbar, and reusable cards, buttons, inputs, and badges
- login currently uses `React Hook Form` + `Zod` and routes to the dashboard shell
- the dashboard home and components showcase are the reference starting points for future front-end expansion
