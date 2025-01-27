'use client'

import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import EditableTypography from '@/components/EditableTypeography'
import { defaultColumns, defaultRowData } from '@/components/grid/columns'
import { ProgramSelect } from '@/components/grid/ProgramSelect'
import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import apiCreateWorkout from '@/fetches/create-workout'
import apiEditWorkout from '@/fetches/edit-workout'
import { toast } from '@/hooks/use-toast'
import { useAIProgram } from '@/hooks/use-workout'
import { Program, Workout } from '@/lib/domain/workouts'
import { useRouter } from 'next/navigation'
import LoadingButton from '../loading-button'
import WorkoutGrid from './WorkoutGrid'

export default function ProgramEditor({
  serverProgram,
}: {
  serverProgram?: Program
}) {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const defaultWorkouts: Workout[] = serverProgram
    ? serverProgram.workouts
    : [
        {
          id: uuidv4().toString(),
          name: 'workout 1',
          program_id: uuidv4().toString(), // populated on create
          program_order: 0,
          blocks: defaultRowData,
        },
      ]

  const isUpdatingExisting = !!serverProgram

  const [programType, setProgramType] = useState(
    serverProgram?.type || 'weekly'
  )
  const [workouts, setWorkouts] = useState<Workout[]>(defaultWorkouts)
  const defaultProgramName = 'my new program'
  const [programName, setProgramName] = useState(
    serverProgram?.name || defaultProgramName
  )

  // update grid when ai program gets generated
  const { program, isPending: isAIGenPending } = useAIProgram()
  useEffect(() => {
    if (program) {
      const workouts: Workout[] = program.workouts.map((w, idx) => {
        return {
          ...w,
          id: uuidv4().toString(), // populated on create
          program_id: uuidv4().toString(), // populated on create
          program_order: idx,
          blocks: w.blocks.map((b) => {
            return {
              ...b,
              id: uuidv4().toString(),
            }
          }),
        }
      })
      setWorkouts(workouts)
    }
  }, [program])

  const handleNewWorkout = ({ week }: { week?: number }) => {
    setWorkouts([
      ...workouts,
      {
        id: uuidv4().toString(),
        name: `workout ${workouts.length + 1}`,
        program_order: workouts.length,
        week: week,
        program_id: uuidv4().toString(), // populated on create
        blocks: defaultRowData,
      },
    ])
  }

  const handleDeletion = (id: string) => {
    const newWorkouts = workouts.filter((w) => w.id !== id)
    setWorkouts(newWorkouts)
  }

  const handleOnCreate = async () => {
    setIsPending(true)
    const { data, error } = await apiCreateWorkout({
      body: {
        type: programType,
        id: uuidv4().toString(),
        created_at: new Date().toISOString(),
        name: programName,
        workouts,
      },
    })
    setIsPending(false)
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error creating workout',
        description: error.message,
      })
      return
    }
    router.push(`/home/programs/${data.id}`)
    toast({
      variant: 'default',
      title: 'Workout created',
      description: (
        <div>
          <pre>{JSON.stringify({ workouts }, null, 2)}</pre>,
        </div>
      ),
    })
  }

  const handleOnSave = async () => {
    setIsPending(true)
    const { error } = await apiEditWorkout({
      body: {
        id: serverProgram!.id,
        type: programType,
        created_at: serverProgram!.created_at,
        name: programName,
        workouts,
      },
    })
    if (error) {
      console.log({ error })
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Oops! We couldn't save your workout.Please try again`,
      })
      setIsPending(false)
      return
    }
    toast({
      variant: 'default',
      title: 'Success',
      description: <pre>{serverProgram!.name} saved</pre>,
    })
    setIsPending(false)
    router.refresh()
  }

  const handleSelect = (v: 'weekly' | 'splits') => {
    setProgramType(v)
  }

  const workoutsByWeek = workouts.reduce((acc, w) => {
    const week = w.week || 0
    if (!acc[week]) {
      acc[week] = []
    }
    acc[week].push(w)
    return acc
  }, [] as Workout[][])

  return (
    <div className="relative w-full overflow-x-auto">
      {isAIGenPending && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-neutral-950/10 pb-14 backdrop-blur-sm">
          <p className="animate-pulse font-light tracking-wide text-neutral-100">
            Generating program...
          </p>
          <div className="flex flex-col items-center justify-center gap-4">
            <Icons.spinner className="h-8 w-8 animate-spin text-neutral-50" />
          </div>
        </div>
      )}
      <div className="mb-4 flex w-full items-center justify-end pl-[72px] pr-8 pt-4">
        <div className="flex-grow">
          <EditableTypography
            className="text-2xl"
            value={programName}
            onChange={setProgramName}
          />
        </div>
        <div className="flex items-center justify-center space-x-2">
          <ProgramSelect value={programType} onValueChange={handleSelect} />
          <LoadingButton
            isLoading={isPending}
            className="w-20"
            variant="outline"
            onClick={() =>
              isUpdatingExisting ? handleOnSave() : handleOnCreate()
            }
          >
            {isUpdatingExisting ? 'Save' : 'Create'}
          </LoadingButton>
        </div>
      </div>
      {workoutsByWeek.map((workouts, idx) => {
        return (
          <div
            key={`by-week-workout-${idx}`}
            id="workout-ui"
            className="w-[1000px]"
          >
            <div className="flex gap-4">
              <div id="workout-grid" className="w-full space-y-8">
                {workouts.map((workout) => {
                  return (
                    <div key={workout.id} className="flex gap-4">
                      <div className="flex-grow space-y-4">
                        <div className="ml-[72px] flex items-center justify-between">
                          <EditableTypography
                            value={workout.name}
                            onChange={(value) => {
                              const newWorkouts = workouts.map((w) => {
                                if (w.id === workout.id) {
                                  return {
                                    ...w,
                                    name: value,
                                  }
                                }
                                return w
                              })
                              setWorkouts(newWorkouts)
                            }}
                          />
                          <div
                            id="action menu"
                            className="flex items-center justify-center pl-2"
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
                        <WorkoutGrid
                          rowData={workout.blocks}
                          columns={defaultColumns}
                          onGridChange={(rows) => {
                            const newWorkouts = workouts.map((w) => {
                              if (w.id === workout.id) {
                                const workoutRows = rows as Workout['blocks']
                                return {
                                  ...w,
                                  blocks: workoutRows,
                                }
                              }
                              return w
                            })
                            setWorkouts(newWorkouts)
                          }}
                        />
                      </div>
                      <div className="mt-[48px] flex flex-col items-stretch">
                        <Button
                          variant="dashed"
                          size="icon"
                          className="flex-grow text-sm font-normal"
                          onClick={() => handleNewWorkout({ week: idx + 1 })}
                        >
                          <Icons.plus className="h-4 w-4 rounded-full" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex w-full items-center justify-end pt-4">
              <Button
                variant="dashed"
                size="sm"
                className="text-sm font-normal"
                onClick={handleNewWorkout}
              >
                <Icons.plus className="h-4 w-4 rounded-full" />
                Add Workout
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
