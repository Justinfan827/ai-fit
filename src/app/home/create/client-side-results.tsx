'use client'
import 'ag-grid-community/styles/ag-grid.css' // Mandatory CSS required by the Data Grid
import 'ag-grid-community/styles/ag-theme-quartz.css' // Optional Theme applied to the Data Grid
import { AgGridReact, CustomCellEditorProps } from 'ag-grid-react' // React Data Grid Component
import { useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { Icons } from '@/components/icons'
import { Typography } from '@/components/typography'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'
import useExercises from '@/hooks/use-exercises'
import { Workout, WorkoutExercise } from '@/lib/ai/openai/schema'
import { WorkoutPlan } from '@/lib/domain/exercises'
import MyGrid from './my-grid'

const defaultRowData = [
  {
    exercise_name: 'Bench Press',
    sets: '3',
    reps: '10',
    weight: '135',
    rest: '60',
    notes: 'This is a note',
  },
  {
    exercise_name: 'Squats',
    sets: '3',
    reps: '10',
    weight: '225',
    rest: '60',
    notes: 'This is a note',
  },
]

const defaultColData = [
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

export default function ClientSideResults() {
  const [workouts, setWorkouts] = useState([
    {
      id: uuidv4().toString(),
      name: 'workout 1',
      rows: defaultRowData,
    },
  ])
  const handleNewWorkout = () => {
    setWorkouts([
      ...workouts,
      {
        id: uuidv4().toString(),
        name: `workout ${workouts.length + 1}`,
        rows: defaultRowData,
      },
    ])
  }
  const handleDeletion = (id: string) => {
    const newWorkouts = workouts.filter((w) => w.id !== id)
    setWorkouts(newWorkouts)
  }

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col items-start justify-start p-6 sm:px-6 lg:px-8">
      <div className="flex w-full items-center justify-end">
        <Button>Save</Button>
      </div>
      <ScrollArea>
        <div id="workout-ui" className="debug w-[1000px]">
          <div id="workout-grid" className="w-full space-y-8">
            {workouts.map((workout) => {
              return (
                <div key={workout.id} className="space-y-4">
                  <div className="ml-[72px] flex items-center justify-start">
                    <Typography
                      className="capitalize leading-none"
                      variant="h3"
                    >
                      {workout.name}
                    </Typography>
                    <div
                      id="action menu"
                      className="flex items-center justify-center px-2"
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-accent-foreground opacity-50 transition-opacity ease-in-out hover:opacity-100"
                        onClick={() => handleDeletion(workout.id)}
                      >
                        <Icons.x className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <MyGrid rowData={workout.rows} columns={defaultColData} />
                </div>
              )
            })}
          </div>
          <div className="flex w-full items-center justify-end pt-4">
            <Button
              variant="dashed"
              size="sm"
              className="text-sm font-normal"
              onClick={handleNewWorkout}
            >
              <Icons.plus className="h-4 w-4 rounded-full" />
              Add workout day
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

function CustomEditorComp({
  value,
  onValueChange,
  eGridCell,
}: CustomCellEditorProps) {
  // on focus of the eGridCell, i want to focus on the input
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [eGridCell])
  return (
    <input
      ref={ref}
      type="text"
      className="w-full px-[15px] focus:outline-none"
      value={value || ''}
      onChange={({ target: { value } }) =>
        onValueChange(value === '' ? null : value)
      }
    />
  )
}

function CustomEditorCompCommand({
  value,
  onValueChange,
  eGridCell,
}: CustomCellEditorProps) {
  // on focus of the eGridCell, i want to focus on the input
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [eGridCell])

  const { isPending, exercises } = useExercises({
    searchTerm: value,
  })
  console.log('results', exercises, value, isPending)
  const handleOnChange = (e: string) => {
    onValueChange(e === '' ? null : e)
  }

  return (
    <Command className="rounded-s">
      <CommandInput
        ref={ref}
        value={value || ''}
        onValueChange={handleOnChange}
      />
      <CommandList>
        <CommandItem className="z-[100]">Search for an exercise</CommandItem>
        {isPending && <CommandItem>Loading...</CommandItem>}
        {!isPending && exercises?.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        {exercises?.map((exercise) => {
          return <CommandItem key={exercise.id}>{exercise.name}</CommandItem>
        })}
      </CommandList>
    </Command>
  )
}

function useWorkoutGrid(workout: Workout) {
  const exerciseMetadataCols = workout.columns.map((c) => {
    return {
      field: c.type,
      headerName: `${c.type} (${c.units})`,
      editable: true,
    }
  })
  const gridCols = [
    {
      field: 'name',
      editable: true,
      headerName: 'Name',
      cellEditor: CustomEditorCompCommand,
      cellEditorPopup: true,
    },
    ...exerciseMetadataCols,
  ]

  const exerciseAsRow = (e: WorkoutExercise) => {
    const baseRow = {
      name: e.exercise_name,
    }
    // zero out the dynamic column values

    exerciseMetadataCols.forEach((c) => {
      baseRow[c.field] = ''
    })

    // use a reduce here instead
    const row = e.metadata.reduce((acc, m) => {
      return {
        ...acc,
        [m.type]: m.value,
      }
    }, baseRow)
    return row
  }
  const gridRows = workout.exercises.map((e) => {
    return exerciseAsRow(e)
  })

  // Row Data: The data to be displayed.
  const [rowData, setRowData] = useState(gridRows)
  // Column Definitions: Defines the columns to be displayed.
  const [colDefs, setColDefs] = useState(gridCols)

  const addNewRow = (e: WorkoutExercise) => {
    const newRow = exerciseAsRow(e)
    setRowData((prev) => {
      return [...prev, newRow]
    })
  }

  return {
    rowData,
    colDefs,
    addNewRow,
    setRowData,
    setColDefs,
  }
}

function WorkoutGrid({ workout }: { workout: Workout }) {
  const { rowData, colDefs, addNewRow } = useWorkoutGrid(workout)
  return (
    // Make this grow with the child container
    <div className="w-full space-y-[1px]">
      <div className="ag-theme-quartz w-full">
        <AgGridReact
          domLayout="autoHeight"
          autoSizeStrategy={{
            type: 'fitGridWidth',
          }}
          rowData={rowData}
          columnDefs={colDefs}
        />
      </div>
      <button
        onClick={() =>
          addNewRow({
            type: 'exercise',
            exercise_name: '',
            metadata: [],
          })
        }
        className="flex w-full items-center justify-center rounded-sm bg-muted py-2 transition-colors hover:bg-border"
      >
        <Icons.plus className="h-4 w-4 rounded-full text-muted-foreground" />
      </button>
    </div>
  )
}

function WorkoutPlanView({ workoutPlan }: { workoutPlan: WorkoutPlan }) {
  // order sort workout plan

  const workouts = workoutPlan.workouts
  workouts.sort((a, b) => {
    if (a.order > b.order) {
      return 1
    } else if (a.order === b.order) {
      return 0
    }
    return -1
  })
  return (
    <div className="h-full w-full space-y-6 pr-4">
      <div className="flex items-center justify-between">
        <Typography variant="h3">{workoutPlan.planName}</Typography>
        <div className="flex gap-2">
          <Button variant="secondary">Start workout</Button>
          <Button>Save Workout</Button>
        </div>
      </div>
      {workouts.map((workout) => {
        return (
          <div key={workout.data.id} className="space-y-4">
            <Typography variant="h3">Workout {workout.order}</Typography>
            <div className="h-[400px] w-full" key={workout.data.id}>
              <WorkoutGrid workout={workout.data} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
