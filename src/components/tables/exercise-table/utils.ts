import type { Exercise } from "@/lib/domain/workouts"
import type { TableExercise } from "./types"

export function asTableExercise(exercise: Exercise): TableExercise {
  return {
    id: exercise.id,
    name: exercise.name,
    isCustom: exercise.ownerId !== null,
    notes: exercise.description,
    videoURL: exercise.videoURL,
    // TODO: Add image url field
    imageURL: "",
    originalExercise: exercise,
  }
}
