import type { Exercise } from "@/lib/domain/workouts"

export type TableExercise = {
  id: string
  name: string
  isCustom: boolean
  notes: string
  imageURL: string
  videoURL: string
  categoryAssignments: Exercise["categories"]
  originalExercise: Exercise
}
