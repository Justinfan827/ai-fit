<!-- 6f544edc-55ac-4c8f-af56-2a400fa51f27 8d6eb8de-7035-46d8-9341-a883b30b9903 -->
# Migrate SettingsExercisesPage to Convex

## Overview

Convert the exercises library page from using Supabase server-side data fetching to using Convex client-side real-time queries.

## Changes Required

### 1. Update Domain Types (`src/lib/domain/workouts.ts`)

Modify the `exerciseSchema` to support Convex ID format:

- Change `id` from UUID string to support Convex IDs (string)
- Change `ownerId` to support Convex ID format (nullable string)
- Keep `categories` structure compatible with both systems

### 2. Create Convex Exercise Query Helper

Add a query to `convex/exercises.ts`:

- `getAllExercisesForUser` - returns both platform exercises (no owner) and user's custom exercises
- Should return data in format: `{ base: Exercise[], custom: Exercise[] }`
- Transform Convex data to match the Exercise domain type

### 3. Convert Page to Client Component (`src/app/home/(sidebar)/settings/exercises/library/page.tsx`)

- Add `"use client"` directive
- Remove server-side imports and data fetching
- Use Convex `useQuery` hook instead
- Keep the same UI structure with SiteHeader

### 4. Update ClientExercisesPage Component

- Remove Promise unwrapping with `use()` hook
- Accept exercises and categories directly as props
- Handle loading states from Convex queries
- Keep the same optimistic updates and state management

### 5. Update Delete Action

Create new Convex mutation for deleting exercises:

- Add `deleteExercise` mutation to `convex/exercises.ts`
- Update `deleteExerciseAction` in `src/actions/delete-exercise.ts` to call Convex
- OR replace with direct Convex mutation call from component

### 6. Update Category Types

Create new type adapters:

- Transform Convex category structure to match `CategoryWithValues` type
- Ensure compatibility with ExerciseTable component expectations

## Implementation Steps

1. **Add `getAllExercisesForUser` query to `convex/exercises.ts`:**
```typescript
export const getAllExercisesForUser = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  returns: v.object({
    base: v.array(exerciseReturnType),
    custom: v.array(exerciseReturnType),
  }),
  handler: async (ctx, args) => {
    // Fetch platform exercises (no owner)
    // Fetch user's custom exercises
    // Transform to Exercise type with categories
  }
})
```

2. **Add `deleteExercise` mutation to `convex/exercises.ts`:**
```typescript
export const deleteExercise = mutation({
  args: { exerciseId: v.id("exercises") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Delete exercise and cascade delete category assignments
  }
})
```

3. **Convert `page.tsx` to client component** that uses `useQuery`

4. **Update `ClientExercisesPage.tsx`** to work with direct data instead of promises

5. **Update `src/lib/domain/workouts.ts`** to support Convex IDs

6. **Test the migration** to ensure all functionality works

### To-dos

- [ ] Update exercise domain types in src/lib/domain/workouts.ts to support Convex ID format
- [ ] Add getAllExercisesForUser and deleteExercise functions to convex/exercises.ts
- [ ] Convert page.tsx from server component to client component using useQuery
- [ ] Update ClientExercisesPage to work with direct data instead of promises
- [ ] Test the exercises page to ensure all functionality works correctly