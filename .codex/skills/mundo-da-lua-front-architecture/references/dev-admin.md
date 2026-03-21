# Dev Admin - Front-end Architecture Reference - Mundo da Lua CRM

This reference is the official front-end architecture guide for Mundo da Lua CRM.
Use it as the source of truth for implementation, review, and architectural decisions.

## Purpose

Use this document to:

- avoid reinventing architectural decisions
- reduce ambiguity across agents and implementations
- standardize structure, UX, visual identity, and data integration
- guide reviews, onboarding, and feature expansion

Priority by task:

- Create a new screen: sections 3, 5, 6, 7, 8, 13
- Create a new component: sections 6, 7, 9, 16
- Integrate GraphQL data: sections 10, 11, 13
- Handle authentication or permission: sections 11, 13
- Make architecture decisions: sections 2, 3, 4
- Validate quality before delivery: sections 15, 16, 17

## 1. Vision

Build the front end with `Next.js` as the main application, aiming for:

- visual consistency
- real performance
- responsiveness
- accessibility
- domain scalability
- low coupling between UI and business rules

The product is multi-tenant and operationally dense. The UI must be fast, predictable, safe for sensitive data, and easy to expand without visual drift.

## 2. Mandatory Architectural Decisions

These decisions are mandatory until an explicit architecture review changes them.

| Topic | Official decision |
|---|---|
| Framework | `Next.js` |
| Routing | `App Router` |
| Language | `TypeScript` |
| Styling | `Tailwind CSS` |
| Design system | central tokens + in-house components on reliable primitives |
| Data layer | `GraphQL` as the only interface |
| Rendering model | `Server Components` by default |
| Local interactivity | `Client Components` only when needed |
| Remote state | GraphQL client cache/control layer |
| Local UI state | local-first; `Zustand` only when truly needed |
| Forms | `React Hook Form` + `Zod` |
| Visual catalog | `Storybook` |
| E2E tests | `Playwright` |

Do not:

- duplicate navigation logic across apps
- create a second design system outside the official base
- adopt multiple competing UI libraries for the same problem

## 3. Architecture Principles

Follow these principles:

### 3.1 Server-first

- render on the server whenever possible
- reduce client-side JavaScript
- use client components only for real interaction

### 3.2 Domain-oriented

- organize code by business domain
- avoid generic folders that hide context
- keep behavior near the feature that needs it

### 3.3 Design consistency

- every new interface must start from the design system
- extend the system instead of bypassing it

### 3.4 Accessibility by default

- accessibility is a requirement, not later polish

### 3.5 Performance as a feature

- evaluate rendering, hydration, and network cost in UI and architecture decisions

### 3.6 Explicit conventions

- keep patterns clear and repeatable
- choose consistency over freedom when there is tension between both

## 4. Recommended Stack

### Framework and base

| Area | Technology | Notes |
|---|---|---|
| Framework | Next.js 16+ | official product base |
| UI runtime | React 19+ | with App Router |
| Language | TypeScript 5+ | required |
| Styling | Tailwind CSS 4 | visual system base |
| Fonts | `next/font` | required for optimization |

### UI and interaction

| Area | Technology | Notes |
|---|---|---|
| Accessible primitives | Radix UI | preferred |
| Component base | shadcn/ui | optional, adapt to the design system |
| Icons | Lucide | recommended |
| Motion | Framer Motion | use only when meaningful |

### Data and forms

| Area | Technology | Notes |
|---|---|---|
| GraphQL client | Apollo Client or urql | choose one and standardize |
| Forms | React Hook Form | default |
| Validation | Zod | input contracts and parsing |
| Codegen | GraphQL Code Generator | required for consistent typing |

### Quality

| Area | Technology |
|---|---|
| Lint | ESLint |
| Formatting | Prettier |
| Unit/UI tests | Vitest + Testing Library |
| E2E | Playwright |
| Visual catalog | Storybook |

Pending bootstrap decision:

- choose exactly one official GraphQL client
- use `Apollo Client` for broader ecosystem and mature normalization
- use `urql` for lighter and simpler operations
- do not introduce both until that decision is formalized

## 5. Project Structure

Scale by domain, not only by file type.

```text
apps/
`-- web/
    |-- app/
    |   |-- (public)/
    |   |   |-- login/
    |   |   |-- recuperar-senha/
    |   |   `-- layout.tsx
    |   |-- (dashboard)/
    |   |   |-- escola/
    |   |   |-- clinica/
    |   |   |-- financeiro/
    |   |   |-- configuracoes/
    |   |   |-- layout.tsx
    |   |   |-- loading.tsx
    |   |   `-- error.tsx
    |   |-- layout.tsx
    |   |-- globals.css
    |   `-- providers.tsx
    |-- src/
    |   |-- features/
    |   |   |-- auth/
    |   |   |-- escola/
    |   |   |-- clinica/
    |   |   `-- financeiro/
    |   |-- components/
    |   |   |-- ui/
    |   |   |-- layout/
    |   |   |-- forms/
    |   |   |-- data-display/
    |   |   `-- feedback/
    |   |-- lib/
    |   |   |-- graphql/
    |   |   |-- auth/
    |   |   |-- permissions/
    |   |   |-- telemetry/
    |   |   |-- formatting/
    |   |   `-- utils/
    |   |-- hooks/
    |   |-- styles/
    |   |-- types/
    |   `-- config/
    |-- public/
    |-- stories/
    `-- tests/
```

Rules:

- `app/` contains routes, layouts, and Next.js boundaries
- `features/` contains domain behavior
- `components/ui/` contains primitives and base reusable components
- `lib/` contains infrastructure, integrations, and helpers
- shared components must not accumulate domain business logic

Suggested internal feature structure:

```text
src/features/escola/alunos/
|-- components/
|-- queries/
|-- mutations/
|-- schema/
|-- hooks/
|-- mappers/
|-- types/
`-- index.ts
```

## 6. Component Model

Use three levels:

| Level | Responsibility |
|---|---|
| UI Primitives | button, input, modal, badge, base table, tabs, tooltip |
| Shared Composites | data table, page header, filters bar, form section, empty state |
| Feature Components | domain-specific components |

Rules:

- `ui/` components must not know GraphQL or business rules
- shared components can compose common layout and visual behavior
- feature components can consume domain hooks and contracts
- pages should not carry large inline logic blocks

Anti-patterns:

- authorization logic inside a generic button
- GraphQL mutation inside a `ui` component
- premature shared components without a real second use case

## 7. Design System and Visual Identity

The CRM visual language must communicate:

- trust
- organization
- operational clarity
- visual lightness
- consistency across modules

Visual strategy:

- light theme by default
- dark mode is optional only if complete and consistent
- balanced contrast, no oversaturation
- medium density for long operational sessions
- strong hierarchy with typography, spacing, and surface layers

Required tokens:

- brand colors and accent colors
- surfaces: `background`, `surface`, `surface-muted`, `border`
- text: `foreground`, `muted-foreground`
- feedback: `success`, `warning`, `destructive`, `info`
- typography scales
- spacing scales
- radii
- shadow levels
- motion durations and easings
- responsive breakpoints

Tenant branding may vary only in controlled ways:

- logo
- institution name
- a controlled secondary accent color

Tenant branding must not allow:

- free visual restructuring
- arbitrary replacement of base tokens
- completely different visual identities per tenant

## 8. UX Standards

Prioritize operational productivity and clarity.

Principles:

- clarity before decoration
- low friction for repetitive tasks
- immediate feedback after actions
- useful empty states
- errors that help users recover
- consistency across modules over local originality

Strategic component groups:

- navigation: sidebar, topbar, breadcrumbs, tabs, command palette
- data: tables, summary cards, timeline, badges, filters
- input: input, select, combobox, date picker, textarea, upload
- feedback: toast, alert, inline error, modal, skeleton, empty state
- productivity: quick actions, bulk actions, shortcuts, pagination, search

Tables:

- treat tables as first-class components
- support pagination, sorting, and filters when relevant
- prefer sticky headers in dense views
- convert to card/list patterns on mobile when needed

Forms:

- split long forms into sections
- show errors near the field
- do not replace labels with placeholders
- keep primary and secondary actions visually clear

## 9. Responsiveness

Be mobile-adaptive, not just scaled down.

Guidelines by breakpoint:

| Range | Guideline |
|---|---|
| Mobile | focus on reading, main action, and simplified navigation |
| Tablet | balance density and comfort |
| Desktop | maximize productivity with wide tables and supporting panels |

Layout rules:

- use fluid grids
- avoid rigid widths on main content
- prefer natural vertical scroll
- keep touch targets comfortable
- collapse secondary elements before primary ones

Navigation:

- fixed or expandable sidebar on desktop
- drawer or sheet on mobile
- keep main actions visible at the top of the current context
- adapt breadcrumbs for smaller screens

Minimum validation:

- login must work well on mobile
- main listings must be usable on tablet
- critical forms must be fully operable on small screens

## 10. Data, GraphQL, and State

Consume data only through GraphQL.

Integration rules:

- generate types from the schema
- reuse fragments by domain
- keep queries and mutations near the features
- translate GraphQL errors into clear UI feedback

State strategy:

| State type | Strategy |
|---|---|
| Server state | official GraphQL client |
| Local UI state | `useState`, `useReducer`, local context |
| Lightweight global state | `Zustand`, only if truly shared |
| Form state | React Hook Form |

Avoid:

- duplicating server state in local stores without need
- spreading raw response parsing through page components
- centralizing every GraphQL operation in one generic folder

Good real-time cases:

- created or changed appointments
- registered payments
- operational notifications
- care-status changes

Do not add subscriptions without clear benefit.

## 11. Authentication, Authorization, and Multi-tenancy

Authentication:

- use secure cookie-based sessions
- do not expose sensitive tokens in `localStorage`
- protect private routes with middleware and session validation

Authorization:

- enforce permissions at route, action, and UI visibility levels
- consult permissions from centralized mechanisms
- UI reflects permissions; it does not replace backend security

Multi-tenancy:

- resolve active tenant at login and keep it in a secure context
- controlled branding must not change the product structure
- data, permissions, and visual context must respect tenant isolation

Avoid:

- duplicated permission checks without standardization
- ad hoc branding per screen
- tenant logic spread across many components without abstraction

## 12. Next.js Implementation Standards

### 12.1 Server Components by default

Use `Server Components` when:

- the page is mostly read-only
- data can be resolved on the server
- rich client-side UI state is not needed

Use `Client Components` when:

- there is an interactive form
- the feature depends on browser APIs
- local UI state is complex
- controlled components require it

### 12.2 Loading and error boundaries

Every important dashboard area should define:

- `loading.tsx` for loading states
- `error.tsx` for recoverable failures
- skeletons instead of blocking loaders when possible

### 12.3 Providers

Keep global providers minimal.

Typical order:

- theme
- session/auth
- GraphQL client
- telemetry
- toasts

Avoid global providers for state that could stay local.

### 12.4 Server Actions

Use Server Actions carefully for Next.js-specific orchestration only.
They do not replace the official GraphQL integration while the backend remains GraphQL-first.

If a Server Action exists, it must:

- orchestrate, not duplicate business logic
- call the same official data layer
- avoid creating a second informal API

### 12.5 Caching and revalidation

- define clear policies by data class
- prefer predictable behavior over obscure micro-optimizations
- invalidate near the feature that changed the data

## 13. Code Conventions

General conventions:

- choose clear and predictable file names
- avoid premature abstractions
- prefer small, cohesive functions
- comment only when adding real context

Components:

- simple visual component: near usage or in `components/ui`
- domain component: inside the feature
- name props semantically

Hooks:

- domain hooks stay inside the feature
- shared hooks require proven cross-cutting use
- hooks must not hide dangerous side effects

Mapping:

- map GraphQL payloads to view models when the UI benefits
- do not spread raw transformation logic across many components

## 14. Performance

Guidelines:

- minimize client-side JavaScript
- use route-level and heavy-feature code splitting
- use `next/font`
- use `next/image` when there is real benefit
- monitor Core Web Vitals
- review library cost before adoption

Initial targets:

| Metric | Goal |
|---|---|
| LCP | under 2.5s |
| CLS | under 0.1 |
| INP | under 200ms |

Rules:

- no heavy UI dependency without justification
- do not hydrate components unnecessarily
- avoid overusing animations and observers
- prefetch only when it creates clear value

## 15. Accessibility

Minimum requirements:

- AA contrast
- full keyboard navigation
- visible `focus-visible`
- real labels on fields
- semantic HTML
- support `prefers-reduced-motion`

Checklist per component:

- modal traps focus correctly
- icon-only button has `aria-label`
- form error is associated with the field
- table is navigable and readable
- important feedback is announced accessibly

Practical rule:

If a component does not work well with keyboard and screen reader, it is not ready.

## 16. Testing, Observability, and Quality

Testing strategy:

| Level | Expected coverage |
|---|---|
| Unit | utilities, validators, formatters, mappers |
| Component | visual states, interaction, basic accessibility |
| Integration | feature flows and data-layer integration |
| E2E | login, main navigation, critical CRUDs, permissions |

Minimum pipeline flows:

- login
- expired session or renewal
- main listing by module
- create and edit critical record
- permission blocking
- minimum responsiveness on key screens

Observability:

- capture front-end errors in a centralized tool
- monitor Core Web Vitals
- register meaningful product events for critical flows

## 17. Agent Checklist

Before implementing, confirm:

- which domain is changing
- whether the screen is server or client
- which GraphQL contract will be used
- whether the design system already solves part of the problem
- which permissions and tenant context affect the flow
- which states are needed: loading, empty, error, success
- what responsive behavior is expected

Before finishing, confirm:

- no parallel visual pattern was created
- no unnecessary global state was introduced
- no business rule was duplicated in the front end
- minimum accessibility is covered
- error, loading, and empty states exist
- feature structure is respected
- performance impact was considered

## 18. Forbidden Anti-patterns

- creating a parallel component library outside the design system
- putting GraphQL logic inside `ui/` components
- storing sensitive tokens in `localStorage`
- duplicating server state across multiple local stores
- shipping screens without loading, empty, and error states
- breaking responsiveness in critical tables and forms
- allowing tenant-specific visual customization outside official token layers
- introducing a heavy dependency for a simple problem

## 19. Official Architecture Summary

The official front-end architecture for Mundo da Lua CRM is:

- `Next.js` as the main platform
- `App Router` as the structural standard
- `Tailwind CSS 4` as the design-system base
- `Server Components` by default
- `GraphQL` as the only data interface
- `Storybook` as the visual catalog
- centralized design tokens as the identity foundation
- continuous focus on accessibility, responsiveness, and performance

## 20. External References

- Next.js Docs: https://nextjs.org/docs
- Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Tailwind CSS Docs: https://tailwindcss.com/docs
- Tailwind CSS `@theme`: https://tailwindcss.com/docs/functions-and-directives
- Storybook Docs: https://storybook.js.org/docs
- Responsive Web Design Basics: https://web.dev/responsive-web-design-basics/

If there is a conflict between a local opinion and this architecture model, this reference wins until a formal review changes it.
