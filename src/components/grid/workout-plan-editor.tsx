'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { defaultColumns, defaultRowData } from '@/components/grid/columns'
import MyGrid from '@/components/grid/workout-grid'
import { Icons } from '@/components/icons'
import { Typography } from '@/components/typography'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import apiCreateWorkout from '@/fetches/create-workout'
import apiEditWorkout from '@/fetches/edit-workout'
import { toast } from '@/hooks/use-toast'
import { Program, Workout } from '@/lib/domain/workouts'
import { useRouter } from 'next/navigation'

export default function WorkoutPlanEditor({
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
          blocks: defaultRowData,
        },
      ]

  const isUpdatingExisting = !!workoutPlan
  const [workouts, setWorkouts] = useState<Workout[]>(defaultWorkouts)
  const handleNewWorkout = () => {
    setWorkouts([
      ...workouts,
      {
        id: uuidv4().toString(),
        name: `workout ${workouts.length + 1}`,
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
        name: 'workout plan',
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
      description: <pre>{JSON.stringify({ workouts }, null, 2)}</pre>,
    })
  }

  const handleOnSave = async () => {
    setIsPending(true)
    const { error } = await apiEditWorkout({
      body: {
        id: workoutPlan!.id,
        name: 'workout plan',
        workouts,
      },
    })
    setIsPending(false)
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Oops! We couldn't save your workout.Please try again`,
      })
      return
    }
    toast({
      variant: 'default',
      title: 'Success',
      description: <pre>{workoutPlan!.name} saved</pre>,
    })
    router.refresh()
  }

  return (
    <div className="mx-auto flex h-full max-w-[1500px] flex-col items-start justify-start py-6 sm:px-2 lg:px-2">
      <div className="flex w-full items-center justify-end">
        <Button
          onClick={isUpdatingExisting ? handleOnSave : handleOnCreate}
          className="w-[100px]"
        >
          {isPending && <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />}
          {isUpdatingExisting ? 'Save' : 'Create'}
        </Button>
      </div>
      <ScrollArea>
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
      </ScrollArea>
    </div>
  )
}

const EditableTypography = ({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [currentValue, setCurrentValue] = useState(value)

  const handleBlur = () => {
    setIsEditing(false)
    if (currentValue !== value) {
      onChange(currentValue)
    }
  }

  const handleInputChange = (e) => {
    setCurrentValue(e.target.value)
  }

  return (
    <div
      className="flex h-8 w-fit min-w-[100px] items-center justify-start"
      onClick={() => !isEditing && setIsEditing(true)}
    >
      {isEditing ? (
        <input
          type="text"
          value={currentValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          autoFocus
          className="debug bg-background text-lg font-semibold capitalize leading-7 tracking-normal focus:border-0 focus:outline-none focus:ring-0" // Apply similar styles to match Typography
          style={{ width: `${currentValue.length + 1}ch` }}
        />
      ) : (
        <Typography
          className="capitalize leading-none underline decoration-neutral-300 decoration-dotted underline-offset-4"
          variant="h3"
        >
          {value || 'Untitled'}
        </Typography>
      )}
    </div>
  )
}
