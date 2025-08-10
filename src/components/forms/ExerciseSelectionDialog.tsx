import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import type { Exercise } from "@/lib/domain/workouts"
import { ExerciseTable } from "../tables/exercise-table/ExerciseTable"

export function ExerciseSelectionDialog({
  exercises: _exercises,
  setExercises,
  selectedExercises,
  allExercises,
  children,
}: {
  exercises: Exercise[]
  setExercises: (exercises: Exercise[]) => void
  selectedExercises: Exercise[]
  allExercises: Exercise[]
  children: React.ReactNode
}) {
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {}
    for (const e of selectedExercises) {
      initial[e.id] = true
    }
    return initial
  })

  // Sync local selection state if selectedExercises prop changes
  useEffect(() => {
    const updated: Record<string, boolean> = {}
    for (const e of selectedExercises) {
      updated[e.id] = true
    }
    setSelectedExerciseIds(updated)
  }, [selectedExercises])

  const handleSelectionChange = (selectedIds: Record<string, boolean>) => {
    setSelectedExerciseIds(selectedIds)
  }

  const handleSave = () => {
    const newExercises = allExercises.filter((e) => selectedExerciseIds[e.id])
    setExercises(newExercises)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Select Exercises</DialogTitle>
          <DialogDescription>
            Choose the exercises you want to include in the generated program.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <ExerciseTable
            data={allExercises.map((e) => ({
              id: e.id,
              name: e.name,
              muscleGroup: e.muscleGroup,
              isCustom: e.ownerId !== null,
              muscleGroups: [e.muscleGroup].filter(Boolean),
              tags: [],
              notes: "",
              imageURL: "",
              videoURL: "",
            }))}
            onSelectionChange={handleSelectionChange}
            selectedRows={selectedExerciseIds}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>
            Select {Object.keys(selectedExerciseIds).length} Exercises
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
