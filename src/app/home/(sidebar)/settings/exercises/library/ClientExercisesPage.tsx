"use client"
import { use, useOptimistic, useState, useTransition } from "react"
import { toast } from "sonner"
import { deleteExerciseAction } from "@/actions/delete-exercise"
import { ExerciseTable } from "@/components/tables/exercise-table/ExerciseTable"
import type { TableExercise } from "@/components/tables/exercise-table/types"
import { asTableExercise } from "@/components/tables/exercise-table/utils"
import type { DBExercises } from "@/lib/supabase/server/users/trainer-repo"
import type { CategoryWithValues } from "@/lib/types/categories"

export function ClientExercisesPage({
  exercisesPromise,
  categoriesPromise,
}: {
  exercisesPromise: Promise<DBExercises>
  categoriesPromise: Promise<CategoryWithValues[]>
}) {
  const exercises = use(exercisesPromise)
  const categories = use(categoriesPromise)

  const [baseExercises, setBaseExercises] = useState<TableExercise[]>(() => {
    const allExercises = exercises.base.concat(exercises.custom)
    return allExercises.map((exercise) => asTableExercise(exercise))
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

  const handleUpdateExercise = (exercise: TableExercise) => {
    // update the row
    setBaseExercises((prev) =>
      prev.map((e) => (e.id === exercise.id ? exercise : e))
    )
  }

  return (
    <ExerciseTable
      categories={categories}
      data={optimisticExercises}
      onDeleteExercise={handleDeleteExercise}
      onSelectionChange={setSelectedRows}
      onUpdateExercise={handleUpdateExercise}
      selectedRows={selectedRows}
    />
  )
}
