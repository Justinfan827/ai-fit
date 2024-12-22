'use client'

import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { defaultColumns, defaultRowData } from '@/components/grid/columns'
import MyGrid from '@/components/grid/workout-grid'
import { Icons } from '@/components/icons'
import { Tp } from '@/components/typography'
import { Button } from '@/components/ui/button'
import apiCreateWorkout from '@/fetches/create-workout'
import apiEditWorkout from '@/fetches/edit-workout'
import { toast } from '@/hooks/use-toast'
import { useAIProgram } from '@/hooks/use-workout'
import { Program, Workout } from '@/lib/domain/workouts'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import LoadingButton from '../loading-button'

export default function ProgramEditor({
  workoutPlan,
}: {
  workoutPlan?: Program
}) {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const defaultWorkouts: Workout[] = workoutPlan
    ? workoutPlan.workouts
    : [
        {
          id: uuidv4().toString(),
          name: 'workout 1',
          program_id: uuidv4().toString(), // populated on create
          program_order: 0,
          blocks: defaultRowData,
        },
      ]

  const isUpdatingExisting = !!workoutPlan

  const [workouts, setWorkouts] = useState<Workout[]>(defaultWorkouts)
  const defaultProgramName = 'my new program'
  const [programName, setProgramName] = useState(
    workoutPlan?.name || defaultProgramName
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

  const handleNewWorkout = () => {
    setWorkouts([
      ...workouts,
      {
        id: uuidv4().toString(),
        name: `workout ${workouts.length + 1}`,
        program_order: workouts.length,
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
        id: workoutPlan!.id,
        created_at: workoutPlan!.created_at,
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
      description: <pre>{workoutPlan!.name} saved</pre>,
    })
    setIsPending(false)
    router.refresh()
  }

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
      <div className="mb-4 flex w-full items-center justify-end pl-[72px] pt-4">
        <div className="flex-grow">
          <EditableTypography
            className="text-2xl"
            value={programName}
            onChange={setProgramName}
          />
        </div>
        <div className="flex items-center justify-center space-x-2">
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
      <div id="workout-ui" className="w-[1000px]">
        <div id="workout-grid" className="w-full space-y-8">
          {workouts.map((workout) => {
            return (
              <div key={workout.id} className="space-y-4">
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
                <MyGrid
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
    </div>
  )
}

const EditableTypography = ({
  value,
  valueDefault = 'Untitled',
  onChange,
  className,
}: {
  value: string
  valueDefault?: string
  onChange: (value: string) => void
  className?: string
}) => {
  const [isEditing, setIsEditing] = useState(false)

  const handleBlur = () => {
    setIsEditing(false)
  }

  const handleInputChange = (e) => {
    onChange(e.target.value)
  }

  return (
    <div
      className="flex h-8 w-fit min-w-[100px] max-w-[200px] items-center justify-start sm:min-w-[100px] sm:max-w-[400px]"
      onClick={() => !isEditing && setIsEditing(true)}
    >
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          autoFocus
          className={cn(
            'w-[200px] bg-background text-lg font-semibold leading-7 tracking-normal focus:border-0 focus:outline-none focus:ring-0 sm:w-[400px]',
            className && className
          )}
        />
      ) : (
        <Tp
          className={cn(
            'truncate leading-none tracking-wide underline decoration-neutral-300 decoration-dotted underline-offset-4',
            className && className,
            !value && 'text-neutral-500'
          )}
          variant="h3"
        >
          {value || valueDefault}
        </Tp>
      )}
    </div>
  )
}
