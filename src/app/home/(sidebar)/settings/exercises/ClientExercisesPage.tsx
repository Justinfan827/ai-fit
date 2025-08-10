"use client"
import { use } from "react"
import { ExerciseTable } from "@/components/tables/exercise-table/ExerciseTable"
import logger from "@/lib/logger/logger"
import type { DBExercises } from "@/lib/supabase/server/users/trainer-repo"

export function ClientExercisesPage({
  exercisesPromise,
}: {
  exercisesPromise: Promise<DBExercises>
}) {
  const exercises = use(exercisesPromise)
  const allExercises = exercises.base.concat(exercises.custom)
  const tableExercises = allExercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    muscleGroups: [exercise.muscleGroup],
    isCustom: exercise.ownerId !== null,
    // TODO: Add these fields
    tags: [],
    notes: "",
    imageURL: "",
    videoURL: "",
  }))
  return (
    <ExerciseTable
      data={tableExercises}
      onSelectionChange={(selectedRows) => {
        logger.info("onSelectionChange", selectedRows)
      }}
      selectedRows={{}}
    />
  )
}
