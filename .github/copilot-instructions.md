# GymTracker AI Coding Instructions

## Project Overview
Next.js 16.1 gym tracking app with Supabase backend. Users log workouts with multiple sets per exercise, track PRs, and visualize progress over time. Portuguese language for all UI content.

## Tech Stack & Architecture
- **Framework**: Next.js 16.1 App Router (RSC + Server Actions)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Validation**: Zod schemas in `lib/validations/`
- **UI**: Tailwind CSS + shadcn/ui components
- **Forms**: React Hook Form with Zod resolver
- **Charts**: Recharts for progress visualization

## Critical Patterns

### Supabase Client Setup
**Two distinct clients** - use the correct one:
- `utils/supabase/server.ts`: Server Components & Server Actions (async, cookie-based)
- `utils/supabase/client.ts`: Client Components (browser context)

```typescript
// Server Component / Server Action
const supabase = await createClient() // note: await!

// Client Component
const supabase = createClient() // no await
```

### Data Flow & Business Logic
**One workout per day pattern**: When creating workout sets, check if a workout exists for today. If yes, reuse it; if no, create a new one. See `app/actions/workout.ts:36-58`.

**Database structure**:
- `workouts` table: One record per training day per user
- `workout_sets` table: Individual sets (exercise_id, weight, reps, set_number)
- `exercises` table: Both default (is_custom=false) and user-created exercises
- `muscle_groups` table: Static groups (Peito, Costas, Pernas, etc.)

### Server Actions Pattern
All mutations use Server Actions in `app/actions/`:
1. `'use server'` directive at top
2. Validate with Zod `.safeParse()`
3. Get authenticated user with `supabase.auth.getUser()`
4. Perform database operations
5. Call `revalidatePath()` for affected routes
6. Return `{ error }` or `{ success: true }`

Example from `app/actions/auth.ts`:
```typescript
'use server'
export async function login(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Email ou senha inválidos' }
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
```

### Authentication & Middleware
- `middleware.ts` refreshes Supabase session on every request
- Protected pages: Check `user` in Server Components, redirect to `/login` if null
- No signup page in frontend - users created via Supabase dashboard or SQL

### Client-Side Data Fetching
Use custom hooks in `hooks/` for client components:
- `useExercises(muscleGroupId)`: Fetches exercises, optionally filtered by muscle group
- Always return `{ data, loading, error, refetch }` pattern

### Component Architecture
- **Server Components**: Dashboard, progress page (fetch data directly in page.tsx)
- **Client Components**: Forms, interactive UI (mark with `'use client'`)
- **shadcn/ui**: Import from `@/components/ui/` (button, card, input, select, etc.)

### Validation Schemas
Zod schemas in `lib/validations/workout.ts`:
- `workoutSetSchema`: Individual set validation
- `workoutFormSchema`: Full workout form with array of sets
- Export inferred types: `WorkoutSetInput`, `WorkoutFormInput`

### Database Queries
**Join patterns**: Use Supabase's nested select syntax:
```typescript
.select(`
  *,
  exercises (
    id,
    name,
    muscle_group_id
  )
`)
```

**RLS is enabled**: All queries automatically filtered by `auth.uid()`. Policies in README.md SQL scripts.

### File Structure Conventions
- Server Actions: `app/actions/*.ts`
- Page routes: `app/{route}/page.tsx`
- Client hooks: `hooks/use*.ts`
- Type definitions: `types/database.types.ts`
- Utilities: `utils/` (keep domain-specific logic like `calculatePR.ts`)
- **DB queries**: `queries/` (centralized Supabase calls, never inline in pages)

## Page Architecture & Separation of Concerns

Every page must follow this separation:

| Layer | Location | Responsibility |
|---|---|---|
| **Queries** | `queries/*.ts` | All Supabase DB calls |
| **Utils** | `utils/*.ts` | Pure functions, shared logic |
| **Hooks** | `hooks/use*.ts` | State + side-effects for client pages |
| **Components** | `app/{route}/components/` | UI specific to that page only |
| **Shared components** | `components/` | Reusable across pages |
| **Page** | `app/{route}/page.tsx` | JSX rendering only, consumes hooks/queries |

### Rules for new pages
1. **DB calls go in `queries/`** — never call Supabase directly from a page or component.
   - Client queries: use `createClient()` from `utils/supabase/client.ts`
   - Server queries: use `await createClient()` from `utils/supabase/server.ts`
2. **Shared logic goes in `utils/`** — if the same function appears in 2+ files, extract it.
3. **Client page state goes in a hook** — create `hooks/use{PageName}Page.ts` for complex pages.
4. **Page file only renders JSX** — import data from hooks or queries, no inline fetch logic.
5. **Page-specific UI components** go in `app/{route}/components/`; reusable ones go in `components/`.

### Existing query files
- `queries/workouts.ts` — `getWorkouts`, `getWorkoutById`, `getTodayWorkoutSets`, `getLastWorkoutByExercise`, `updateWorkoutSets`
- `queries/dashboard.ts` — `getDashboardData` (server-side, all dashboard data in one call)
- `queries/progress.ts` — `getProgressByExercise`, `getWorkoutSetsForMuscleGroups`

### Existing utility files
- `utils/workoutUtils.ts` — `groupWorkoutsByDate`, `getUniqueDates`, `filterWorkouts`
- `utils/progressUtils.ts` — `calculateMuscleGroupStats`
- `utils/calculatePR.ts` — `calculateOverallPR`, `getProgressData`, `formatWeight`

## Development Workflow
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
```

**Database setup**: Run SQL scripts from README.md in order (tables → RLS → policies → seed data)

## Key Files
- `middleware.ts`: Session refresh for all routes
- `app/actions/workout.ts`: Workout creation logic (one-per-day pattern)
- `types/database.types.ts`: All database table types
- `lib/validations/workout.ts`: Form validation schemas
- `utils/calculatePR.ts`: Personal Record calculations

## Language & UI
- **Portuguese**: All UI text, error messages, and content
- **Dates**: Format with `.toLocaleDateString('pt-BR')`
- **Icons**: lucide-react (already installed)

## Common Gotchas
- Always `await createClient()` in server context (RSC/Server Actions)
- Use `revalidatePath()` after mutations to update cached data
- Check `user` exists before database operations in Server Actions
- RLS policies prevent cross-user data access - no manual user_id filtering needed in queries
- `workouts` table has `date` field, but `workout_sets` has `created_at` - join carefully
