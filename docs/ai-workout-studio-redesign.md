# AI Workout Studio Redesign

## Overview

This document outlines the redesign of the workout studio to enable fast, streaming AI-assisted editing. The key insight is that **the data model determines the ceiling for AI editing speed and reliability**.

Current problems:

- Nested block structure requires complex path-based addressing
- Array indices shift on insert/delete, breaking AI references
- No stable row identifiers for streaming updates
- Heavy transformation layer between domain model and grid

Solution: Flat row model with stable IDs, where AI operations map directly to grid rows.

---

## Data Model

### New Convex Schema

```typescript
// convex/schema.ts additions

// Circuits table - stores circuit metadata
circuits: defineTable({
  workoutId: v.id("workouts"),
  name: v.string(),
  order: v.number(),           // Sort order within workout
  sets: v.string(),            // Shared sets for all exercises in circuit
  rest: v.string(),            // Shared rest for all exercises in circuit
  notes: v.optional(v.string()),
  createdAt: v.string(),
})
  .index("by_workout_id", ["workoutId"])
  .index("by_workout_id_and_order", ["workoutId", "order"]),

// Exercise rows table - each row = one grid row
workoutExercises: defineTable({
  workoutId: v.id("workouts"),

  // Circuit grouping (null = standalone exercise)
  circuitId: v.optional(v.id("circuits")),

  // Reference to exercise library
  exerciseId: v.id("exercises"),
  exerciseName: v.string(),    // Denormalized for display/search

  // Training variables
  sets: v.string(),
  reps: v.string(),
  weight: v.string(),
  rest: v.string(),
  notes: v.optional(v.string()),

  // Ordering
  order: v.number(),           // Global order within workout
  circuitOrder: v.optional(v.number()), // Order within circuit (if in circuit)

  // Timestamps
  createdAt: v.string(),
  updatedAt: v.optional(v.string()),
})
  .index("by_workout_id", ["workoutId"])
  .index("by_workout_id_and_order", ["workoutId", "order"])
  .index("by_circuit_id", ["circuitId"]),
```

### TypeScript Types

```typescript
// src/lib/domain/workout-row.ts

import type { Id } from 'convex/_generated/dataModel'

export interface WorkoutExerciseRow {
  _id: Id<'workoutExercises'>
  workoutId: Id<'workouts'>
  circuitId?: Id<'circuits'>
  exerciseId: Id<'exercises'>
  exerciseName: string
  sets: string
  reps: string
  weight: string
  rest: string
  notes?: string
  order: number
  circuitOrder?: number
  createdAt: string
  updatedAt?: string
}

export interface Circuit {
  _id: Id<'circuits'>
  workoutId: Id<'workouts'>
  name: string
  order: number
  sets: string
  rest: string
  notes?: string
  createdAt: string
}

// For grid display - combines row data with circuit info
export interface WorkoutGridRow {
  id: string // Row ID for grid (= _id)
  type: 'exercise' | 'circuit-header'

  // Exercise data (null for circuit headers)
  exerciseId?: string
  exerciseName: string
  sets: string
  reps: string
  weight: string
  rest: string
  notes: string

  // Circuit info
  circuitId?: string
  circuitName?: string
  isInCircuit: boolean

  // Ordering
  order: number

  // Pending change state (for streaming)
  pendingChange?: PendingChange
}

export interface PendingChange {
  id: string // Change ID (for undo)
  type: 'adding' | 'updating' | 'removing'
  field?: string // Which field changed (for cell edits)
  oldValue?: unknown // Previous value (for undo)
  streamedAt: number // Timestamp
  toolCallId?: string // AI tool call that created this
}
```

### Migration Strategy

The `workouts.blocks` field currently stores the nested structure. Migration approach:

1. Keep `blocks` field for backward compatibility during transition
2. Add new tables (`circuits`, `workoutExercises`)
3. Create migration script to flatten existing blocks into rows
4. Update queries to read from new tables
5. Eventually deprecate `blocks` field

---

## AI Tool Schema

### Unified Edit Operations

```typescript
// src/lib/ai/tools/workoutEdit/schemas.ts

import { z } from 'zod'

// Cell-level edit (fastest, most granular)
const cellEditSchema = z.object({
  type: z.literal('cell'),
  rowId: z.string().describe('The stable ID of the row to edit'),
  field: z.enum(['sets', 'reps', 'weight', 'rest', 'notes']),
  value: z.string(),
})

// Row-level operations
const addRowSchema = z.object({
  type: z.literal('addRow'),
  afterRowId: z
    .string()
    .nullable()
    .describe('Insert after this row, or null for start'),
  exerciseId: z.string().describe('ID from exercise library'),
  exerciseName: z.string(),
  sets: z.string().default('3'),
  reps: z.string().default('10'),
  weight: z.string().default(''),
  rest: z.string().default('60s'),
  notes: z.string().optional(),
  circuitId: z.string().optional().describe('Add to existing circuit'),
})

const updateRowSchema = z.object({
  type: z.literal('updateRow'),
  rowId: z.string(),
  exerciseId: z.string().optional(),
  exerciseName: z.string().optional(),
  sets: z.string().optional(),
  reps: z.string().optional(),
  weight: z.string().optional(),
  rest: z.string().optional(),
  notes: z.string().optional(),
})

const removeRowSchema = z.object({
  type: z.literal('removeRow'),
  rowId: z.string(),
})

const moveRowSchema = z.object({
  type: z.literal('moveRow'),
  rowId: z.string(),
  afterRowId: z.string().nullable(),
})

// Circuit operations
const createCircuitSchema = z.object({
  type: z.literal('createCircuit'),
  rowIds: z.array(z.string()).min(2).describe('Rows to group into circuit'),
  name: z.string(),
  sets: z.string().optional(),
  rest: z.string().optional(),
})

const dissolveCircuitSchema = z.object({
  type: z.literal('dissolveCircuit'),
  circuitId: z.string(),
})

// Program-level operations (existing)
const addWorkoutSchema = z.object({
  type: z.literal('addWorkout'),
  afterWorkoutId: z.string().nullable(),
  name: z.string(),
  exercises: z.array(addRowSchema.omit({ type: true, afterRowId: true })),
})

const removeWorkoutSchema = z.object({
  type: z.literal('removeWorkout'),
  workoutId: z.string(),
})

const moveWorkoutSchema = z.object({
  type: z.literal('moveWorkout'),
  workoutId: z.string(),
  afterWorkoutId: z.string().nullable(),
})

// Union of all operations
export const workoutEditSchema = z.discriminatedUnion('type', [
  cellEditSchema,
  addRowSchema,
  updateRowSchema,
  removeRowSchema,
  moveRowSchema,
  createCircuitSchema,
  dissolveCircuitSchema,
  addWorkoutSchema,
  removeWorkoutSchema,
  moveWorkoutSchema,
])

export type WorkoutEdit = z.infer<typeof workoutEditSchema>
```

### Wrapped Schema for OpenAI

OpenAI structured outputs don't support discriminated unions at root level:

```typescript
// Wrapped version for streaming
export const workoutEditWrappedSchema = z.object({
  operationType: z.enum([
    'cell',
    'addRow',
    'updateRow',
    'removeRow',
    'moveRow',
    'createCircuit',
    'dissolveCircuit',
    'addWorkout',
    'removeWorkout',
    'moveWorkout',
  ]),
  cell: cellEditSchema.omit({ type: true }).optional(),
  addRow: addRowSchema.omit({ type: true }).optional(),
  updateRow: updateRowSchema.omit({ type: true }).optional(),
  removeRow: removeRowSchema.omit({ type: true }).optional(),
  moveRow: moveRowSchema.omit({ type: true }).optional(),
  createCircuit: createCircuitSchema.omit({ type: true }).optional(),
  dissolveCircuit: dissolveCircuitSchema.omit({ type: true }).optional(),
  addWorkout: addWorkoutSchema.omit({ type: true }).optional(),
  removeWorkout: removeWorkoutSchema.omit({ type: true }).optional(),
  moveWorkout: moveWorkoutSchema.omit({ type: true }).optional(),
})
```

---

## Streaming Architecture

### State Management

```typescript
// src/hooks/use-workout-streaming.ts

interface StreamingState {
  // Current rows with pending changes applied
  rows: WorkoutGridRow[]

  // Pending changes by row ID
  pendingChanges: Map<string, PendingChange>

  // Rows being added (not yet committed)
  pendingAdditions: Map<string, WorkoutGridRow>

  // Rows being removed (still visible with strikethrough)
  pendingRemovals: Set<string>

  // Active tool call ID
  activeToolCallId: string | null
}

interface UseWorkoutStreamingReturn {
  // Current display state
  displayRows: WorkoutGridRow[]

  // Apply a streamed operation (called as AI streams)
  applyOperation: (op: WorkoutEdit, toolCallId: string) => void

  // Commit all pending changes to database
  commitChanges: () => Promise<void>

  // Revert all pending changes
  revertChanges: () => void

  // Revert a specific change
  revertChange: (changeId: string) => void

  // Check if there are pending changes
  hasPendingChanges: boolean
}
```

### Operation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Chat Input                            │
│                "Add 3 sets of squats after bench press"         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI Tool Call                               │
│  streamObject() generates:                                      │
│  { type: "addRow", afterRowId: "bench_id", exerciseName: ... }  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   useWorkoutStreaming                           │
│  1. Parse operation                                             │
│  2. Generate temp ID for new row                                │
│  3. Add to pendingAdditions with type: "adding"                 │
│  4. Recalculate displayRows                                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WorkoutDataGrid                              │
│  - Renders new row with green highlight                         │
│  - Shows "pending" indicator                                    │
│  - Row is editable but changes are local                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              On Stream Complete / User Accepts                  │
│  commitChanges():                                               │
│  1. Batch insert/update/delete to Convex                        │
│  2. Clear pending state                                         │
│  3. Optimistic update while mutation runs                       │
└─────────────────────────────────────────────────────────────────┘
```

### Applying Operations

```typescript
function applyOperation(
  state: StreamingState,
  op: WorkoutEdit,
  toolCallId: string
): StreamingState {
  const changeId = `${toolCallId}-${Date.now()}`

  switch (op.type) {
    case 'cell': {
      const row = state.rows.find((r) => r.id === op.rowId)
      if (!row) return state

      const pendingChange: PendingChange = {
        id: changeId,
        type: 'updating',
        field: op.field,
        oldValue: row[op.field],
        streamedAt: Date.now(),
        toolCallId,
      }

      return {
        ...state,
        rows: state.rows.map((r) =>
          r.id === op.rowId ? { ...r, [op.field]: op.value, pendingChange } : r
        ),
        pendingChanges: new Map(state.pendingChanges).set(
          op.rowId,
          pendingChange
        ),
      }
    }

    case 'addRow': {
      const tempId = `temp-${changeId}`
      const afterIndex = op.afterRowId
        ? state.rows.findIndex((r) => r.id === op.afterRowId)
        : -1

      const newRow: WorkoutGridRow = {
        id: tempId,
        type: 'exercise',
        exerciseId: op.exerciseId,
        exerciseName: op.exerciseName,
        sets: op.sets,
        reps: op.reps,
        weight: op.weight,
        rest: op.rest,
        notes: op.notes ?? '',
        isInCircuit: !!op.circuitId,
        circuitId: op.circuitId,
        order: afterIndex + 1,
        pendingChange: {
          id: changeId,
          type: 'adding',
          streamedAt: Date.now(),
          toolCallId,
        },
      }

      const newRows = [...state.rows]
      newRows.splice(afterIndex + 1, 0, newRow)

      return {
        ...state,
        rows: reorderRows(newRows),
        pendingAdditions: new Map(state.pendingAdditions).set(tempId, newRow),
      }
    }

    case 'removeRow': {
      return {
        ...state,
        rows: state.rows.map((r) =>
          r.id === op.rowId
            ? {
                ...r,
                pendingChange: {
                  id: changeId,
                  type: 'removing',
                  streamedAt: Date.now(),
                  toolCallId,
                },
              }
            : r
        ),
        pendingRemovals: new Set(state.pendingRemovals).add(op.rowId),
      }
    }

    // ... other operations
  }
}
```

---

## Grid Integration

### Column Definitions

```typescript
// src/components/workout-data-grid/workout-columns.ts

import { ColumnDef } from '@tanstack/react-table'
import { WorkoutGridRow } from '@/lib/domain/workout-row'

export const workoutColumns: ColumnDef<WorkoutGridRow>[] = [
  {
    id: 'exerciseName',
    accessorKey: 'exerciseName',
    header: 'Exercise',
    size: 200,
    meta: {
      label: 'Exercise',
      cell: { variant: 'short-text' }, // Custom variant with combobox
    },
  },
  {
    id: 'sets',
    accessorKey: 'sets',
    header: 'Sets',
    size: 80,
    meta: {
      label: 'Sets',
      cell: { variant: 'short-text' },
    },
  },
  {
    id: 'reps',
    accessorKey: 'reps',
    header: 'Reps',
    size: 100,
    meta: {
      label: 'Reps',
      cell: { variant: 'short-text' },
    },
  },
  {
    id: 'weight',
    accessorKey: 'weight',
    header: 'Weight',
    size: 100,
    meta: {
      label: 'Weight',
      cell: { variant: 'short-text' },
    },
  },
  {
    id: 'rest',
    accessorKey: 'rest',
    header: 'Rest',
    size: 80,
    meta: {
      label: 'Rest',
      cell: { variant: 'short-text' },
    },
  },
  {
    id: 'notes',
    accessorKey: 'notes',
    header: 'Notes',
    size: 200,
    meta: {
      label: 'Notes',
      cell: { variant: 'long-text' },
    },
  },
]
```

### Pending Change Styling

```typescript
// src/components/workout-data-grid/use-pending-styles.ts

export function getPendingCellStyles(pendingChange?: PendingChange): string {
  if (!pendingChange) return ''

  switch (pendingChange.type) {
    case 'adding':
      return cn(
        'bg-green-500/10 border-l-2 border-l-green-500',
        'ring-1 ring-green-500/20 ring-inset'
      )
    case 'removing':
      return cn(
        'bg-red-500/10 border-l-2 border-l-red-500 opacity-60',
        'ring-1 ring-red-500/20 ring-inset',
        'line-through'
      )
    case 'updating':
      return cn(
        'bg-blue-500/10 border-l-2 border-l-blue-500',
        'ring-1 ring-blue-500/20 ring-inset'
      )
  }
}
```

### WorkoutDataGrid Component

```typescript
// src/components/workout-data-grid/WorkoutDataGrid.tsx

interface WorkoutDataGridProps {
  workoutId: string;
  rows: WorkoutGridRow[];
  onRowsChange: (rows: WorkoutGridRow[]) => void;
  pendingChanges: Map<string, PendingChange>;
  readOnly?: boolean;
}

export function WorkoutDataGrid({
  workoutId,
  rows,
  onRowsChange,
  pendingChanges,
  readOnly = false,
}: WorkoutDataGridProps) {
  const dataGrid = useDataGrid({
    data: rows,
    columns: workoutColumns,
    onDataChange: onRowsChange,
    readOnly,
    enableSearch: true,
    enablePaste: true,
    rowHeight: "short",
  });

  // Inject pending change styles via custom cell wrapper
  const tableMeta = useMemo(() => ({
    ...dataGrid.tableMeta,
    pendingChanges,
    getPendingCellStyles,
  }), [dataGrid.tableMeta, pendingChanges]);

  return (
    <DataGrid
      {...dataGrid}
      tableMeta={tableMeta}
      height={600}
    />
  );
}
```

---

## Convex Mutations

### Batch Operations

```typescript
// convex/workoutExercises.ts

import { mutation } from './_generated/server'
import { v } from 'convex/values'

// Batch apply multiple operations atomically
export const batchApply = mutation({
  args: {
    workoutId: v.id('workouts'),
    operations: v.array(v.any()), // WorkoutEdit[]
  },
  returns: v.object({
    success: v.boolean(),
    appliedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, { workoutId, operations }) => {
    const errors: string[] = []
    let appliedCount = 0

    for (const op of operations) {
      try {
        switch (op.type) {
          case 'cell': {
            await ctx.db.patch(op.rowId as Id<'workoutExercises'>, {
              [op.field]: op.value,
              updatedAt: new Date().toISOString(),
            })
            break
          }

          case 'addRow': {
            await ctx.db.insert('workoutExercises', {
              workoutId,
              exerciseId: op.exerciseId as Id<'exercises'>,
              exerciseName: op.exerciseName,
              sets: op.sets,
              reps: op.reps,
              weight: op.weight,
              rest: op.rest,
              notes: op.notes,
              order: op.order,
              circuitId: op.circuitId as Id<'circuits'> | undefined,
              circuitOrder: op.circuitOrder,
              createdAt: new Date().toISOString(),
            })
            break
          }

          case 'removeRow': {
            await ctx.db.delete(op.rowId as Id<'workoutExercises'>)
            break
          }

          // ... other operations
        }
        appliedCount++
      } catch (error) {
        errors.push(`Failed to apply ${op.type}: ${error}`)
      }
    }

    // Reorder all rows after batch
    await reorderWorkoutRows(ctx, workoutId)

    return { success: errors.length === 0, appliedCount, errors }
  },
})

// Helper to ensure consistent ordering
async function reorderWorkoutRows(ctx: MutationCtx, workoutId: Id<'workouts'>) {
  const rows = await ctx.db
    .query('workoutExercises')
    .withIndex('by_workout_id_and_order', (q) => q.eq('workoutId', workoutId))
    .collect()

  for (let i = 0; i < rows.length; i++) {
    if (rows[i].order !== i) {
      await ctx.db.patch(rows[i]._id, { order: i })
    }
  }
}
```

---

## Implementation Plan

### Phase 1: Data Model (Week 1)

1. Add `circuits` and `workoutExercises` tables to Convex schema
2. Create TypeScript types for new model
3. Write migration script to flatten existing `blocks` data
4. Add Convex queries/mutations for CRUD on new tables

### Phase 2: Grid Component (Week 1-2)

1. Create `WorkoutDataGrid` component using tablecn `useDataGrid`
2. Define column configurations
3. Implement custom `ExerciseCell` with combobox
4. Add pending change styling

### Phase 3: Streaming Hook (Week 2)

1. Implement `useWorkoutStreaming` hook
2. Add operation application logic for each edit type
3. Implement commit/revert functionality
4. Add optimistic updates

### Phase 4: AI Tool Integration (Week 2-3)

1. Create unified `workoutEdit` tool schema
2. Update AI system prompt with new operation format
3. Wire streaming to grid via hook
4. Test end-to-end flow

### Phase 5: Polish (Week 3)

1. Add undo/redo support
2. Keyboard shortcuts for accept/reject
3. Batch operation performance optimization
4. Error handling and recovery

---

## Open Questions

1. **Circuit header rows**: Should circuit headers be separate rows in the grid, or just visual grouping of exercise rows?

2. **Conflict resolution**: If AI edits a row while user is editing the same row, how do we handle?

3. **Partial commits**: Should users be able to accept some AI changes and reject others within a single tool call?

4. **History/audit**: Do we need to track who made each change (user vs AI) for audit purposes?
