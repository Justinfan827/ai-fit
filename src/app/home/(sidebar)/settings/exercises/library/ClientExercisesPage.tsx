"use client"
import { use, useOptimistic, useState, useTransition } from "react"
import { toast } from "sonner"
import { deleteExerciseAction } from "@/actions/delete-exercise"
import { ExerciseTable } from "@/components/tables/exercise-table/ExerciseTable"
import type { TableExercise } from "@/components/tables/exercise-table/types"
import logger from "@/lib/logger/logger"
import type { DBExercises } from "@/lib/supabase/server/users/trainer-repo"

export function ClientExercisesPage({
  exercisesPromise,
}: {
  exercisesPromise: Promise<DBExercises>
}) {
  const exercises = use(exercisesPromise)

  const [baseExercises, setBaseExercises] = useState<TableExercise[]>(() => {
    const allExercises = exercises.base.concat(exercises.custom)
    return allExercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      isCustom: exercise.ownerId !== null,
      // TODO: Add these fields
      notes: "",
      imageURL: "",
      videoURL: "",
    }))
  })

  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({})

  const [optimisticExercises, deleteOptimisticExercise] = useOptimistic(
    baseExercises,
    (state, exerciseId: string) => {
      return state.filter((exercise) => exercise.id !== exerciseId)
    }
  )
  const [, startTransition] = useTransition()

  const handleDeleteExercise = (exerciseId: string) => {
    startTransition(async () => {
      try {
        deleteOptimisticExercise(exerciseId)
        const { error } = await deleteExerciseAction({ exerciseId })
        if (error) {
          throw error
        }
        setBaseExercises((prev) => prev.filter((e) => e.id !== exerciseId))
        const deletedExercise = baseExercises.find(
          (exercise) => exercise.id === exerciseId
        )
        toast.success("Exercise deleted successfully", {
          description: <code className="text-xs">{deletedExercise?.name}</code>,
        })
      } catch {
        toast.error("Failed to delete exercise")
      }
    })
  }

  return (
    <ExerciseTable
      data={optimisticExercises}
      onDeleteExercise={handleDeleteExercise}
      onSelectionChange={(newSelectedRows) => {
        logger.info("onSelectionChange", newSelectedRows)
        setSelectedRows(newSelectedRows)
      }}
      selectedRows={selectedRows}
    />
  )
}
