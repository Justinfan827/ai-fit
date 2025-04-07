import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { Exercise } from '@/lib/domain/workouts'
import { ExerciseTable } from './ExerciseTable'

export function ExerciseSelectionDialog({
  exercises,
  setExercises,
}: {
  exercises: Exercise[]
  setExercises: (exercises: Exercise[]) => void
}) {
  const exerciseCount = exercises.length
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{exerciseCount} Exercises Selected</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Choose the exercises you want to include in the generated program.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* <ExerciseCombobox exercises={exercises} /> */}
          <ExerciseTable
            data={exercises.map((e) => ({
              id: e.id,
              name: e.name,
              muscleGroup: e.muscleGroup,
              isCustom: e.ownerId !== null,
            }))}
          />
        </div>
        <DialogFooter>
          <Button type="submit">Select {exerciseCount} Exercises</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
