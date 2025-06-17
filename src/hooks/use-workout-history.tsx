import { Workout } from '@/lib/domain/workouts'
import { useCallback, useEffect, useRef, useState } from 'react'

interface WorkoutHistoryState {
  history: Workout[]
  currentIndex: number
}

export function useWorkoutHistory(initialWorkout: Workout) {
  const [state, setState] = useState<WorkoutHistoryState>({
    history: [initialWorkout],
    currentIndex: 0,
  })

  // Track if we're in the middle of an operation to prevent double-saving
  const isUpdatingRef = useRef(false)

  const currentWorkout = state.history[state.currentIndex]
  const canUndo = state.currentIndex > 0
  const canRedo = state.currentIndex < state.history.length - 1

  // Save current state to history before making changes
  const saveToHistory = useCallback((workout: Workout) => {
    if (isUpdatingRef.current) return

    setState((prev) => {
      // If we're not at the end of history, remove future states
      const newHistory = prev.history.slice(0, prev.currentIndex + 1)

      // Add new state
      newHistory.push(workout)

      // Limit history size to prevent memory issues (keep last 50 states)
      const maxHistorySize = 50
      if (newHistory.length > maxHistorySize) {
        newHistory.shift()
        return {
          history: newHistory,
          currentIndex: newHistory.length - 1,
        }
      }

      return {
        history: newHistory,
        currentIndex: newHistory.length - 1,
      }
    })
  }, [])

  const undo = useCallback(() => {
    if (!canUndo) return

    isUpdatingRef.current = true
    setState((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex - 1,
    }))

    // Reset flag after state update
    setTimeout(() => {
      isUpdatingRef.current = false
    }, 0)
  }, [canUndo])

  const redo = useCallback(() => {
    if (!canRedo) return

    isUpdatingRef.current = true
    setState((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
    }))

    // Reset flag after state update
    setTimeout(() => {
      isUpdatingRef.current = false
    }, 0)
  }, [canRedo])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  // Reset history when initial workout changes (e.g., new workout loaded)
  const resetHistory = useCallback((newWorkout: Workout) => {
    setState({
      history: [newWorkout],
      currentIndex: 0,
    })
  }, [])

  return {
    currentWorkout,
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    historyLength: state.history.length,
    currentIndex: state.currentIndex,
  }
}
