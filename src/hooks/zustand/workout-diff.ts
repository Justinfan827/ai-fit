import { WorkoutDiff } from '@/lib/types/workout-diff'
import { create } from 'zustand'

interface DiffState {
  pendingDiff: WorkoutDiff | null
  setPendingDiff: (diff: WorkoutDiff | null) => void
  applyDiff: () => void
  rejectDiff: () => void
}

export const useDiffStore = create<DiffState>((set, get) => ({
  pendingDiff: null,

  setPendingDiff: (diff: WorkoutDiff | null) => {
    set({ pendingDiff: diff })
  },

  applyDiff: () => {
    const { pendingDiff } = get()
    if (!pendingDiff) return

    // This will be implemented when integrating with your existing workout editor
    // For now, we'll just clear the diff to indicate it's been applied
    console.log('Applying diff:', pendingDiff)

    // TODO: Implement actual diff application logic
    // 1. Validate workout hash if provided
    // 2. Apply each change using your existing applyIncrementalChange function
    // 3. Push to workout history
    // 4. Clear pending diff

    set({ pendingDiff: null })
  },

  rejectDiff: () => {
    set({ pendingDiff: null })
  },
}))
