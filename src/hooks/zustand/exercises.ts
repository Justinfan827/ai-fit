import Fuse from "fuse.js"
import { create } from "zustand"
import type { Exercise } from "@/lib/domain/workouts"

type TimerState = {
  exercises: Exercise[]
  actions: TimerActions
}

type TimerActions = {
  search: (query: string) => Exercise[]
  getExercises: () => void
}

const useExerciseStore = create<TimerState>((set, get) => ({
  exercises: [],
  actions: {
    getExercises: async () => {
      const res = await fetch("/api/exercises")
      if (!res.ok) {
        console.log("failed to fetch exercises client side")
      }
      const { data } = await res.json()
      set({ exercises: data })
    },
    search: (query = "") => {
      const { exercises } = get()
      const options = {
        includeScore: true,
        keys: [
          {
            name: "name",
            weight: 1,
          },
        ],
      }
      const fuse = new Fuse(exercises, options)
      const result = fuse.search(query, {
        limit: 10,
      })
      return result.map((r) => r.item)
    },
  },
}))

// 💡 exported - consumers don't need to write selectors
export const useClientExercises = () =>
  useExerciseStore((state) => state.exercises)

// 🎉 one selector for all our actions
export const useExerciseActions = () =>
  useExerciseStore((state) => state.actions)
