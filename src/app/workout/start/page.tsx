'use client'
import 'ag-grid-community/styles/ag-grid.css' // Mandatory CSS required by the Data Grid
import 'ag-grid-community/styles/ag-theme-quartz.css' // Optional Theme applied to the Data Grid
import { AgGridReact } from 'ag-grid-react'
import { useEffect, useState } from 'react'

import { Typography } from '@/components/typography'
import { Button } from '@/components/ui/button'
import apiGenerateWorkoutPlan from '@/fetches/generate-workout'
import { useAsyncFetch } from '@/hooks/async-fetch'
import { toast } from '@/hooks/use-toast'
import WorkoutPlanProvider, { useWorkoutPlan } from '@/hooks/use-workout'
import { Metadata, Workout, WorkoutExercise } from '@/lib/ai/openai/schema'
import { ColDef } from '@ag-grid-community/core'

export default function StartWorkout() {
  return (
    <WorkoutPlanProvider>
      <WorkoutInstance />
    </WorkoutPlanProvider>
  )
}

function WorkoutInstance() {
  const { workoutPlan, setWorkoutPlan } = useWorkoutPlan()
  const { runQuery, isPending } = useAsyncFetch({
    queryFunc: async () => {
      const { data, error } = await apiGenerateWorkoutPlan({
        prompt: '',
      })
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
        return
      }
      setWorkoutPlan(data)
    },
  })

  useEffect(() => {
    runQuery()
  }, [])

  if (isPending || !workoutPlan) {
    return <div className="p-2">loading...</div>
  }
  return (
    <div className="p-2">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4">{workoutPlan!.planName}</Typography>
          <Typography className="text-muted-foreground" variant="p">
            {workoutPlan!.workouts[0].data.name}
          </Typography>
        </div>
        <Button variant="outline">Start</Button>
      </div>
      <div className="space-y-6">
        <WorkoutStartInstance workout={workoutPlan!.workouts[0].data} />;
      </div>
    </div>
  )
}

function WorkoutExerciseInstance({ exercise }: { exercise: WorkoutExercise }) {
  return (
    <div key={exercise.id} className="space-y-2">
      <Typography variant="h4">{exercise.exercise_name}</Typography>
      <ExerciseGrid exercise={exercise} />
    </div>
  )
}

function WorkoutStartInstance({ workout }: { workout: Workout }) {
  return (
    <div key={workout.id} className="space-y-2">
      <div className="space-y-6">
        {workout.exercises.map((exercise) => {
          return (
            <WorkoutExerciseInstance key={exercise.id} exercise={exercise} />
          )
        })}
      </div>
    </div>
  )
}

function getColumnFromMetadata(metadata: Metadata) {
  switch (metadata.type) {
    case 'reps':
      return {
        field: 'reps',
        headerName: 'Reps',
        editable: true,
        resizable: true,
        sortable: false,
        cellEditor: 'agNumberCellEditor',
      }
    case 'rpe':
      return {
        field: 'rpe',
        headerName: 'Target',
        editable: true,
        resizable: false,
        sortable: false,
      }
    case 'weight':
      return {
        field: 'weight',
        headerName: 'Weight',
        editable: true,
        resizable: false,
        sortable: false,
        cellEditor: 'agNumberCellEditor',
      }
    default:
      return {
        field: metadata.type,
        headerName: metadata.type,
        editable: false,
        resizable: false,
        sortable: false,
        hide: true,
      }
  }
}

interface IGridRow {
  setNumber: number
  reps: string
  rpe: string
  weight: string
}

function enforceColOrder(cols: ColDef<IGridRow>[]) {
  return [
    cols.find((c) => c.field === 'setNumber'),
    cols.find((c) => c.field === 'rpe'),
    cols.find((c) => c.field === 'weight'),
    cols.find((c) => c.field === 'reps'),
  ]
}

function useExerciseGrid(exercise: WorkoutExercise) {
  const numSets = Number(
    exercise.metadata.find((md) => md.type === 'sets')?.value
  )
  const restMeta = exercise.metadata.filter((md) => md.type !== 'sets')
  const rpeCol = restMeta.find((md) => md.type === 'rpe')!
  const weightCol = restMeta.find((md) => md.type === 'weight')!
  const repsCol = restMeta.find((md) => md.type === 'reps')!
  const gridCols: ColDef<any>[] = [
    { field: 'setNumber', headerName: `Set`, sortable: false },
    getColumnFromMetadata(rpeCol),
    getColumnFromMetadata(weightCol),
    getColumnFromMetadata(repsCol),
  ]
  // create a row per set
  const gridRows = new Array(numSets || 1).fill(0).map((_, idx) => {
    const setNum = idx + 1
    const row = {
      setNumber: setNum,
      reps: restMeta.find((md) => md.type === 'reps')?.value || '-',
      rpe: restMeta.find((md) => md.type === 'rpe')?.value || '-',
      weight: restMeta.find((md) => md.type === 'weight')?.value || '-',
    }
    return row
  })

  console.log({
    name: exercise.exercise_name,
    gridCols,
    gridRows,
    numSets,
  })

  // Row Data: The data to be displayed.
  const [rowData, setRowData] = useState(gridRows)
  // Column Definitions: Defines the columns to be displayed.
  const [colDefs, setColDefs] = useState(gridCols)

  const addNewRow = (e: WorkoutExercise) => {
    // const newRow = exerciseAsRow(e);
    // setRowData((prev) => {
    //   return [...prev, newRow];
    // });
  }

  return {
    rowData,
    colDefs,
    addNewRow,
    setRowData,
    setColDefs,
  }
}

function ExerciseGrid({ exercise }: { exercise: WorkoutExercise }) {
  const { rowData, colDefs } = useExerciseGrid(exercise)
  return (
    // Make this grow with the child container
    <div className="w-full space-y-[1px]">
      <div className="ag-theme-quartz w-full">
        <AgGridReact
          domLayout="autoHeight"
          autoSizeStrategy={{
            type: 'fitGridWidth',
          }}
          singleClickEdit={true}
          rowData={rowData}
          columnDefs={colDefs}
        />
      </div>
    </div>
  )
}
