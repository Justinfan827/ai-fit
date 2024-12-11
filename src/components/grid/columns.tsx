import { v4 } from "uuid"

export const defaultColumns = [
  {
    field: 'exercise_name',
    header: 'Exercise',
    width: 250,
  },
  {
    field: 'sets',
    header: 'Sets',
    width: 100,
  },
  {
    field: 'reps',
    header: 'Reps',
    width: 100,
  },
  {
    field: 'weight',
    header: 'lbs',
    width: 100,
  },
  {
    field: 'rest',
    header: 'Rest',
    width: 100,
  },
  {
    field: 'notes',
    header: 'Notes',
    width: 200,
  },
]

export const defaultRowData = [
  {
    id: v4().toString(),
    exercise_name: 'Bench Press',
    sets: '3',
    reps: '10',
    weight: '135',
    rest: '60',
    notes: 'This is a note',
  },
  {
    id: v4().toString(),
    exercise_name: 'Squats',
    sets: '3',
    reps: '10',
    weight: '225',
    rest: '60',
    notes: 'This is a note',
  },
]
