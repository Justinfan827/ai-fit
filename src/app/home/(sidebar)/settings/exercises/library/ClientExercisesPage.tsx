"use client"

import { useMutation } from "convex/react"
import { useState } from "react"
import { toast } from "sonner"
import { ExerciseTable } from "@/components/tables/exercise-table/ExerciseTable"
import type { TableExercise } from "@/components/tables/exercise-table/types"
import { asTableExercise } from "@/components/tables/exercise-table/utils"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import type { Exercise } from "@/lib/domain/workouts"
import type { CategoryWithValues } from "@/lib/types/categories"

export function ClientExercisesPage({
  exercises,
  categories,
}: {
  exercises: { base: Exercise[]; custom: Exercise[] }
  categories: CategoryWithValues[]
}) {
  const deleteExerciseMutation = useMutation(api.exercises.deleteExercise)

  const [baseExercises, setBaseExercises] = useState<TableExercise[]>(() => {
    const allExercises = exercises.base.concat(exercises.custom)
    return allExercises.map((exercise) => asTableExercise(exercise))
  })

  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({})

  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      await deleteExerciseMutation({
        exerciseId: exerciseId as Id<"exercises">,
      })
      setBaseExercises((prev) => prev.filter((e) => e.id !== exerciseId))
      const deletedExercise = baseExercises.find(
        (exercise) => exercise.id === exerciseId
      )
      toast.success("Exercise deleted successfully", {
        description: <code className="text-xs">{deletedExercise?.name}</code>,
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete exercise"
      )
    }
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
      data={baseExercises}
      onDeleteExercise={handleDeleteExercise}
      onSelectionChange={setSelectedRows}
      onUpdateExercise={handleUpdateExercise}
      selectedRows={selectedRows}
    />
  )
}
