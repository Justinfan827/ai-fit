'use client'

import useDebouncedValue from '@/hooks/use-debounce'
import { Workout } from '@/lib/domain/workouts'
import { useEffect, useState } from 'react'

function useExercises({ searchTerm }: { searchTerm: string }) {
  const debouncedTerm = useDebouncedValue(searchTerm, 150)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(undefined)
  // undefined to distinguish between no data yet vs. no results
  const [exercises, setExercises] = useState<Workout | undefined>(undefined)

  // TODO: debounce the search term and signal cancel the previous request
  useEffect(() => {
    let ignore = false
    const queryFn = async (query: string) => {
      setIsPending(true)
      try {
        const res = await fetch(`/api/exercises/search?query=${query}`)
        if (!res.ok) {
          throw new Error('Failed to fetch exercises: ' + res.status)
        }
        const { data } = await res.json()
        // ignore flag as per react docs
        if (!ignore) {
          setExercises(data)
          setError(undefined)
        }
      } catch (e) {
        if (!ignore) {
          setError(e)
          setError(undefined)
        }
      } finally {
        if (!ignore) {
          setIsPending(false)
        }
      }
    }
    queryFn(debouncedTerm)
    return () => {
      ignore = true
    }
  }, [debouncedTerm])
  return {
    isPending,
    error,
    exercises,
  }
}

export default useExercises
