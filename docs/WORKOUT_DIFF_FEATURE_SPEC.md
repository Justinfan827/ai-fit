# AI-Assisted Workout Diff & Approval Feature

## 1. Problem Statement
Trainers want to ask the AI to tweak a client's workout and then **visually review** the exact cell-level edits before they are committed. They must be able to accept or reject the proposed changes atomically.

## 2. Goals & Non-Goals
- **Goals**
  - Let a user request modifications ("Add a pulling movement", "Decrease total volume < 25 sets") via the existing chat sidebar.
  - Display a visual diff overlay on `WorkoutGrid` that highlights changed/added/removed values.
  - Provide **Apply** and **Reject** buttons to commit or discard all pending edits.
  - Preserve full undo/redo history integration.
- **Non-Goals**
  - Real-time collaborative diff merging.
  - Server-side persistence (handled by existing save flows).

## 3. Data Contracts
### 3.1 Diff Representation
```ts
// src/lib/types/workout-diff.ts
export type WorkoutDiff = {
  id: string               // uuid for reference
  changes: GridChange[]    // reuse existing incremental change types
  summary?: string         // short natural-language description
  workoutHash?: string     // optional optimistic-concurrency check
}
```
`GridChange` already exists in `WorkoutGrid.tsx` and covers `CellChange` & `ExerciseSelection`.

### 3.2 Chat API Extension
Request body additions (sent from `ProgramEditorSidebar`):
```jsonc
{
  "currentWorkout": <Workout>,
  "diffMode": true
}
```
Response shape when `diffMode` is true:
```jsonc
{
  "diff": <WorkoutDiff>,
  "assistantMessage": "Removed a set from Bench Press and added Pull-ups."
}
```

## 4. UI Behaviour
1. The AI reply triggers `setPendingDiff(diff)` in a new Zustand store.
2. `WorkoutGrid` receives `pendingDiff` prop and decorates affected cells:
   - Green background → new/changed value.
   - Red strikethrough → removed value (empty string).
3. A toolbar inside `ProgramEditorSidebar` footer shows **Apply** / **Reject** when a diff exists.

## 5. Accept / Reject Flow
- **Reject** → clear `pendingDiff` (no state changes).
- **Apply** → iterate `diff.changes`, call existing `applyIncrementalChange`, push to `workoutHistory`, then clear `pendingDiff`.

## 6. State Management
Zustand slice (`useDiffStore`):
```ts
type DiffState = {
  pendingDiff: WorkoutDiff | null
  setPendingDiff(diff: WorkoutDiff | null): void
  applyDiff(): void
  rejectDiff(): void
}
```

## 7. Validation & Safety
- Attach **`workoutHash`** (SHA-1 of the serialized `Workout`) to each diff so the client can detect divergence before applying.
- When the user clicks **Apply**, compare `diff.workoutHash` against a fresh hash of the in-memory workout:
  - If they match ➜ proceed.
  - If they differ ➜ show a non-blocking toast "Workout changed since diff was generated. Please regenerate." and clear `pendingDiff`.
- Hard-cap `diff.changes.length` at **100**. If the LLM exceeds this budget, return `diffTooLarge: true` and fall back to full plan regeneration.

## 8. Incremental Roll-out
1. Ship grid diff visuals with a **mock diff** for internal QA.
2. Gate AI diff generation under `NEXT_PUBLIC_FEATURE_AI_DIFF` flag.
3. Collect usage & error metrics.

---

# Implementation Checklist

- [ ] **Type Definitions**
  - [ ] Create `src/lib/types/workout-diff.ts` with `WorkoutDiff`.
- [ ] **Zustand Store**
  - [ ] Add `src/hooks/zustand/workout-diff.ts` implementing `DiffState`.
- [ ] **WorkoutGrid Enhancements**
  - [ ] Accept optional `pendingDiff` prop.
  - [ ] Map `diff.changes` to cell coords & apply CSS (`diff-added`, `diff-removed`).
  - [ ] Add Tailwind utilities to `globals.css`.
- [ ] **ProgramEditorSidebar**
  - [ ] When submitting a message, include `currentWorkout` & `diffMode`.  
  - [ ] On response, store `diff` via `useDiffStore.setPendingDiff`.
  - [ ] Render **Apply / Reject** buttons in footer when diff is present.
- [ ] **Apply / Reject Logic**
  - [ ] Implement `applyDiff` that reuses `applyIncrementalChange` for each change and pushes to `useWorkoutHistory`.
  - [ ] Implement `rejectDiff` that simply clears `pendingDiff`.
- [ ] **/api/chat Route**
  - [ ] Detect `diffMode`; if true, craft prompt with `currentWorkout` & ask the LLM for function-call returning `WorkoutDiff`.
  - [ ] Return `{diff, assistantMessage}`.
- [ ] **Prompt Engineering**
  - [ ] Update `src/lib/ai/prompts/prompts.ts` to include new system message template for diff generation.
- [ ] **Testing / QA**
  - [ ] Add unit tests for `applyDiff` logic.
  - [ ] Manual QA: mock diff → visual check, accept, reject, undo/redo.
- [ ] **Feature Flag & Roll-out**
  - [ ] Respect `NEXT_PUBLIC_FEATURE_AI_DIFF` env variable in sidebar.
  - [ ] Document in `CHANGELOG.md` once stable.
- [ ] **Hash Utility**
  - [ ] Create `src/lib/utils/workout-hash.ts` with `computeWorkoutHash(workout): string` using `crypto.subtle.digest` (browser) & Node's `crypto` fallback.
- [ ] **Error Handling**
  - [ ] Display toast notifications for hash mismatch, oversize diff, and generic failures via `sonner`.
- [ ] **Telemetry**
  - [ ] Emit `diff_received`, `diff_apply`, `diff_reject`, and `diff_hash_mismatch` events through `vercel-analytics`.

## 9. Error Handling & UX Safeguards
| Scenario | Desired Behaviour |
| --- | --- |
| Hash mismatch (`workoutHash` differs) | Non-blocking toast ("Workout changed, diff discarded.") + clear `pendingDiff`. |
| Diff exceeds 100 changes | Inline banner "Large change, regenerating full workout…" then bypass diff view. |
| Network / LLM error | Keep workout untouched, surface error inside chat area. |

## 11. Future Considerations
- Partial cell-level acceptance (v2).
- Server-side diff persistence enabling collaboration.
- Diffs that span multiple workouts or entire programs. 