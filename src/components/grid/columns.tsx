import { v4 } from "uuid"
import type { ExerciseBlock } from "@/lib/domain/workouts"

export interface Column {
  field: string // the field of the column (rows use this to identify which column they belong to)
  header: string // the header name of the column
  width?: number // the CSS width of the column
}

export const defaultColumns: Column[] = [
  {
    field: "exercise_name",
    header: "Exercise",
    width: 250,
  },
  {
    field: "sets",
    header: "Sets",
    width: 100,
  },
  {
    field: "reps",
    header: "Reps",
    width: 100,
  },
  {
    field: "weight",
    header: "lbs",
    width: 100,
  },
  {
    field: "rest",
    header: "Rest",
    width: 100,
  },
  {
    field: "notes",
    header: "Notes",
    width: 200,
  },
]

export const defaultRowData = [
  {
    id: v4().toString(),
    exercise_name: "Bench Press",
    sets: "3",
    reps: "10",
    weight: "135",
    rest: "60",
    notes: "This is a note",
  },
  {
    id: v4().toString(),
    exercise_name: "Squats",
    sets: "3",
    reps: "10",
    weight: "225",
    rest: "60",
    notes: "This is a note",
  },
]

export const defaultBlocks: ExerciseBlock[] = [
  {
    type: "exercise",
    exercise: {
      id: v4().toString(),
      name: "Bench Press",
      metadata: {
        sets: "3",
        reps: "10",
        weight: "135",
        rest: "60",
        notes: "This is a note",
      },
    },
  },
  {
    type: "exercise",
    exercise: {
      id: v4().toString(),
      name: "Squats",
      metadata: {
        sets: "3",
        reps: "10",
        weight: "225",
        rest: "60",
        notes: "This is a note",
      },
    },
  },
]
