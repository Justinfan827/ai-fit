---
name: TanStack Start Migration
overview: Migrate the Next.js App Router application to TanStack Start in 5 phases, each independently testable.
todos:
  - id: phase1-deps
    content: 'Phase 1: Install TanStack Start dependencies'
    status: completed
  - id: phase1-vite
    content: 'Phase 1: Create vite.config.ts'
    status: completed
  - id: phase1-tsconfig
    content: 'Phase 1: Update tsconfig.json for Vite'
    status: completed
  - id: phase1-env
    content: 'Phase 1: Create .env.local with VITE_* variables'
    status: completed
  - id: phase1-router
    content: 'Phase 1: Create src/router.tsx'
    status: completed
  - id: phase1-styles
    content: 'Phase 1: Create src/styles.css from globals.css'
    status: completed
  - id: phase1-test
    content: 'Phase 1: Verify dev server starts'
    status: completed
  - id: phase2-providers
    content: 'Phase 2: Create Clerk and Convex providers'
    status: pending
  - id: phase2-root
    content: 'Phase 2: Create src/routes/__root.tsx'
    status: pending
  - id: phase2-index
    content: 'Phase 2: Create src/routes/index.tsx'
    status: pending
  - id: phase2-login
    content: 'Phase 2: Create src/routes/login.tsx'
    status: pending
  - id: phase2-test
    content: 'Phase 2: Test / and /login routes work'
    status: pending
  - id: phase3-home-layout
    content: 'Phase 3: Create src/routes/home.tsx layout with sidebar'
    status: pending
  - id: phase3-home-index
    content: 'Phase 3: Create src/routes/home/index.tsx'
    status: pending
  - id: phase3-clients
    content: 'Phase 3: Create src/routes/home/clients.tsx'
    status: pending
  - id: phase3-programs
    content: 'Phase 3: Create src/routes/home/programs.tsx'
    status: pending
  - id: phase3-test
    content: 'Phase 3: Test /home/* routes with sidebar'
    status: pending
  - id: phase4-dynamic
    content: 'Phase 4: Create dynamic routes ($clientId, $programid)'
    status: pending
  - id: phase4-settings
    content: 'Phase 4: Create settings routes'
    status: pending
  - id: phase4-studio
    content: 'Phase 4: Create studio routes'
    status: pending
  - id: phase4-test
    content: 'Phase 4: Test all dynamic routes'
    status: pending
  - id: phase5-links
    content: 'Phase 5: Update all Link imports in components'
    status: pending
  - id: phase5-cleanup
    content: 'Phase 5: Remove Next.js files and dependencies'
    status: pending
  - id: phase5-test
    content: 'Phase 5: Full integration test'
    status: pending
---

# TanStack Start Migration Plan

Based on your reference implementation at `/Users/justinfan/Developer/tanstack-start-test`.

---

## Overview

This migration is split into **5 phases**, each independently testable:

| Phase | Description | Checkpoint |

|-------|-------------|------------|

| 1 | Project Setup | Dev server starts with test page |

| 2 | Root + Auth Routes | `/` and `/login` work |

| 3 | Home Layout + Core Routes | `/home/clients` and `/home/programs` work with sidebar |

| 4 | Dynamic + Settings Routes | All remaining routes work |

| 5 | Component Updates + Cleanup | Full app works, Next.js removed |

---

## Key Differences from Next.js

| Next.js | TanStack Start |

|---------|----------------|

| `page.tsx` in folders | `home/clients.tsx` or `home.clients.tsx` |

| `layout.tsx` | `__root.tsx` with `shellComponent` |

| `[param]` folder | `$param` in filename: `$clientId.tsx` |

| `(group)` folder | Not needed |

| `next/link` | `@tanstack/react-router` Link with `to` |

| `redirect()` | `throw redirect()` in `beforeLoad` |

| `NEXT_PUBLIC_*` | `VITE_*` via `import.meta.env` |

---

# Phase 1: Project Setup and Configuration

**Goal:** Get TanStack Start dev server running with a minimal test route.

**Checkpoint:** `pnpm dev:tanstack` starts and shows a test page at `http://localhost:3001`

### 1.1 Install Dependencies

```bash
pnpm add @tanstack/react-start @tanstack/react-router @tanstack/react-router-devtools \
  @tanstack/router-plugin @tanstack/react-devtools @tanstack/react-router-ssr-query \
  @tailwindcss/vite nitro vite vite-tsconfig-paths @vitejs/plugin-react @tanstack/devtools-vite \
  @convex-dev/react-query
```

### 1.2 Update package.json Scripts

```json
{
  "scripts": {
    "dev:tanstack": "vite dev --port 3001",
    "build:tanstack": "vite build",
    "preview": "vite preview"
  }
}
```

Note: Keep Next.js scripts during migration, use port 3001 for TanStack.

### 1.3 Create vite.config.mts (or vite.config.ts with "type": "module" in package.json)

```typescript
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  plugins: [
    devtools(),
    nitro(),
    viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
```

### 1.4 Update tsconfig.json

```json
{
  "include": ["**/*.ts", "**/*.tsx"],
  "compilerOptions": {
    "target": "ES2022",
    "jsx": "react-jsx",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": false,
    "noEmit": true,
    "skipLibCheck": true,
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### 1.5 Create Environment Variables

Create/update `.env.local`:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CONVEX_URL=https://...convex.cloud
```

### 1.6 Create src/router.tsx

```typescript
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  })
  return router
}
```

### 1.7 Create src/styles.css

Copy from `src/app/globals.css`, update Tailwind import:

```css
@import 'tailwindcss';
@import 'tw-animate-css';

/* ... rest of your CSS variables ... */
```

### 1.8 Create Minimal Test Route

Create `src/routes/__root.tsx`:

```typescript
import { HeadContent, Scripts, createRootRoute, Outlet } from '@tanstack/react-router'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'TanStack Start Test' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body className="h-screen w-full bg-background text-foreground">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
```

Create `src/routes/index.tsx`:

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: TestPage,
})

function TestPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">TanStack Start Works!</h1>
    </div>
  )
}
```

### 1.9 Test Phase 1

```bash
pnpm dev:tanstack
# Visit http://localhost:3001
# Should see "TanStack Start Works!"
```

**Note:** Additional fixes required:

- Add `"type": "module"` to `package.json` (or rename `vite.config.ts` to `vite.config.mts`)
- Rename `postcss.config.js` to `postcss.config.cjs` to work with ES modules

**Status:** ✅ Phase 1 completed and verified working.

---

# Phase 2: Root Layout + Auth Routes

**Goal:** Add providers, login page, and proper root layout.

**Checkpoint:** `/` redirects to `/login`, login page renders correctly.

### 2.1 Create Provider Wrappers

**src/integrations/clerk/provider.tsx:**

```typescript
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!PUBLISHABLE_KEY) {
  throw new Error('Add VITE_CLERK_PUBLISHABLE_KEY to .env.local')
}

export default function AppClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      {children}
    </ClerkProvider>
  )
}
```

**src/integrations/convex/provider.tsx:**

```typescript
import { ConvexProvider } from 'convex/react'
import { ConvexQueryClient } from '@convex-dev/react-query'

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL
if (!CONVEX_URL) {
  console.error('Missing VITE_CONVEX_URL')
}
const convexQueryClient = new ConvexQueryClient(CONVEX_URL)

export default function AppConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convexQueryClient.convexClient}>
      {children}
    </ConvexProvider>
  )
}
```

### 2.2 Update src/routes/\_\_root.tsx

```typescript
import { HeadContent, Scripts, createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import ClerkProvider from '../integrations/clerk/provider'
import ConvexProvider from '../integrations/convex/provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'AI Fitness Workout Generator' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><HeadContent /></head>
      <body className="h-screen w-full">
        <ClerkProvider>
          <ConvexProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              disableTransitionOnChange
              enableSystem
            >
              {children}
              <Toaster />
              <TanStackDevtools
                config={{ position: 'bottom-right' }}
                plugins={[{ name: 'Router', render: <TanStackRouterDevtoolsPanel /> }]}
              />
            </ThemeProvider>
          </ConvexProvider>
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  )
}
```

### 2.3 Create src/routes/index.tsx (with redirect)

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/login' })
  },
})
```

### 2.4 Create src/routes/login.tsx

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { UnauthHeader } from '@/components/header'
import { LoginForm } from '@/components/login-form'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="h-dvh">
      <UnauthHeader />
      <div className="my-auto flex h-[calc(100dvh-8rem)] items-center justify-center space-y-8">
        <LoginForm />
      </div>
    </div>
  )
}
```

### 2.5 Test Phase 2

```bash
pnpm dev:tanstack
# Visit http://localhost:3001 - should redirect to /login
# Visit http://localhost:3001/login - should show login form
```

---

# Phase 3: Home Layout + Core Routes

**Goal:** Create sidebar layout and main pages (clients, programs).

**Checkpoint:** `/home/clients` and `/home/programs` render with sidebar.

### 3.1 Create src/routes/home.tsx (Layout Route)

```typescript
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppSidebar } from '@/components/nav/sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export const Route = createFileRoute('/home')({
  component: HomeLayout,
})

function HomeLayout() {
  return (
    <SidebarProvider
      defaultOpen={true}
      style={{
        '--sidebar-width': 'calc(var(--spacing) * 72)',
        '--header-height': 'calc(var(--spacing) * 16)',
        '--inset-height': 'calc(var(--spacing) * 2)',
      } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
```

### 3.2 Create src/routes/home/index.tsx

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/home/')({
  beforeLoad: () => {
    throw redirect({ to: '/home/clients' })
  },
})
```

### 3.3 Create src/routes/home/clients.tsx

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import ClientButtonNewClient from '@/components/ClientButtonNewClient'
import { SiteHeader } from '@/components/site-header'
import { BasicSkeleton } from '@/components/skeletons/basic-skeleton'
import ClientsListWithData from '@/app/home/(sidebar)/clients/clients-list-with-data'

export const Route = createFileRoute('/home/clients')({
  component: ClientsPage,
  ssr: false,
})

function ClientsPage() {
  return (
    <>
      <SiteHeader left="Clients" right={<ClientButtonNewClient />} />
      <div className="@container/main flex flex-1 flex-col" id="clients content">
        <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
          <Suspense fallback={<BasicSkeleton />}>
            <ClientsListWithData />
          </Suspense>
        </div>
      </div>
    </>
  )
}
```

### 3.4 Create src/routes/home/programs.tsx

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import NewProgramButton from '@/app/home/(sidebar)/programs/new-program-button'
import ProgramsListWithData from '@/app/home/(sidebar)/programs/programs-list-with-data'

export const Route = createFileRoute('/home/programs')({
  component: ProgramsPage,
  ssr: false,
})

function ProgramsPage() {
  return (
    <>
      <SiteHeader left="Programs" right={<NewProgramButton />} />
      <div className="@container/main flex flex-1 flex-col" id="programs content">
        <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
          <ProgramsListWithData />
        </div>
      </div>
    </>
  )
}
```

### 3.5 Test Phase 3

```bash
pnpm dev:tanstack
# Visit http://localhost:3001/home/clients - should show sidebar + clients
# Visit http://localhost:3001/home/programs - should show sidebar + programs
```

---

# Phase 4: Dynamic + Remaining Routes

**Goal:** Add all remaining routes including dynamic params.

**Checkpoint:** All routes work (`/home/clients/$id`, `/home/studio/$id`, settings).

### 4.1 Create src/routes/home/clients.$clientId.tsx

```typescript
import { createFileRoute } from '@tanstack/react-router'
// Import the client detail page component

export const Route = createFileRoute('/home/clients/$clientId')({
  component: ClientDetailPage,
  ssr: false,
})

function ClientDetailPage() {
  const { clientId } = Route.useParams()
  // ... use clientId to load client data
}
```

### 4.2 Create src/routes/home.studio.$programid.tsx

Note: This goes in `src/routes/` not `src/routes/home/` because studio doesn't share the sidebar layout.

```typescript
import { createFileRoute } from '@tanstack/react-router'
// Import program editor components

export const Route = createFileRoute('/home/studio/$programid')({
  component: ProgramEditorPage,
  ssr: false,
})

function ProgramEditorPage() {
  const { programid } = Route.useParams()
  // ... program editor logic using programid
}
```

### 4.3 Create Settings Routes

**src/routes/home/settings.general.tsx:**

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/home/settings/general')({
  component: GeneralSettingsPage,
  ssr: false,
})

function GeneralSettingsPage() {
  // ... settings page
}
```

**src/routes/home/settings.exercises.library.tsx:**

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/home/settings/exercises/library')({
  component: ExerciseLibraryPage,
  ssr: false,
})

function ExerciseLibraryPage() {
  // ... exercise library page
}
```

**src/routes/home/settings.exercises.configuration.tsx:**

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/home/settings/exercises/configuration')({
  component: ExerciseConfigPage,
  ssr: false,
})

function ExerciseConfigPage() {
  // ... exercise config page
}
```

### 4.4 Create src/routes/home.studio.version2.tsx

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/home/studio/version2')({
  component: StudioV2Page,
  ssr: false,
})

function StudioV2Page() {
  // ... version 2 studio page
}
```

### 4.5 Test Phase 4

```bash
pnpm dev:tanstack
# Test all routes work:
# /home/clients/[some-id]
# /home/studio/[some-program-id]
# /home/settings/general
# /home/settings/exercises/library
# /home/settings/exercises/configuration
# /home/studio/version2
```

---

# Phase 5: Component Updates + Cleanup

**Goal:** Update all components to use TanStack Router, remove Next.js.

**Checkpoint:** Full app works on TanStack Start, Next.js removed.

### 5.1 Update Link Components

Find all files using `next/link`:

```bash
grep -r "from 'next/link'" src/components/
grep -r 'from "next/link"' src/components/
```

Replace pattern:

```typescript
// Before
import Link from 'next/link'
<Link href="/home/clients">Clients</Link>

// After
import { Link } from '@tanstack/react-router'
<Link to="/home/clients">Clients</Link>
```

### 5.2 Update useRouter/usePathname

```typescript
// Before
import { useRouter, usePathname } from 'next/navigation'
const router = useRouter()
const pathname = usePathname()
router.push('/home/clients')

// After
import { useRouter, useLocation } from '@tanstack/react-router'
const router = useRouter()
const location = useLocation()
router.navigate({ to: '/home/clients' })
```

### 5.3 Update Sidebar Navigation

The sidebar uses links that need updating. Also add `activeProps` for active state:

```typescript
<Link
  to="/home/clients"
  className="..."
  activeProps={{ className: '... active-styles' }}
>
  Clients
</Link>
```

### 5.4 Update package.json Scripts

```json
{
  "scripts": {
    "dev": "vite dev --port 3000",
    "build": "vite build",
    "start": "vite preview"
  }
}
```

### 5.5 Remove Next.js Dependencies

```bash
pnpm remove next @clerk/nextjs next-safe-action next-themes
```

Keep `@clerk/clerk-react` (already added).

### 5.6 Delete Next.js Files

- `next.config.js`
- `src/app/` (entire directory)
- `src/middleware.ts`
- `postcss.config.js` (if using @tailwindcss/vite)

### 5.7 Final Test

```bash
pnpm dev
# Full integration test - all routes and features work
```

---

## Files Summary

### Files to Create

| Phase | File |

|-------|------|

| 1 | `vite.config.ts` |

| 1 | `src/router.tsx` |

| 1 | `src/styles.css` |

| 1 | `src/routes/__root.tsx` (minimal) |

| 1 | `src/routes/index.tsx` (test) |

| 2 | `src/integrations/clerk/provider.tsx` |

| 2 | `src/integrations/convex/provider.tsx` |

| 2 | `src/routes/__root.tsx` (full) |

| 2 | `src/routes/login.tsx` |

| 3 | `src/routes/home.tsx` |

| 3 | `src/routes/home/index.tsx` |

| 3 | `src/routes/home/clients.tsx` |

| 3 | `src/routes/home/programs.tsx` |

| 4 | `src/routes/home/clients.$clientId.tsx` |

| 4 | `src/routes/home/settings.general.tsx` |

| 4 | `src/routes/home/settings.exercises.library.tsx` |

| 4 | `src/routes/home/settings.exercises.configuration.tsx` |

| 4 | `src/routes/home.studio.$programid.tsx` |

| 4 | `src/routes/home.studio.version2.tsx` |

### Files to Delete (Phase 5)

- `next.config.js`
- `src/app/` (entire folder)
- `src/middleware.ts`
- `postcss.config.js`

---

## API Routes Strategy (Deferred)

For `/api/chat`, convert to server function:

```typescript
import { createServerFn } from '@tanstack/react-start'

const chatHandler = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    // ... chat logic
  }
)
```

Or use route handler pattern:

```typescript
export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async (request) => {
        return json({ ... })
      },
    },
  },
})
```

---

## Deferred to Auth Phase

- Protected route guards using `beforeLoad`
- ConvexProviderWithClerk for authenticated Convex
- Server-side auth checks
