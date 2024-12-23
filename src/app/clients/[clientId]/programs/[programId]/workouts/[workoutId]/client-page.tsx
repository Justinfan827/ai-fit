'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Icons } from '@/components/icons'
import LoadingButton from '@/components/loading-button'
import { Tp } from '@/components/typography'
import { Button } from '@/components/ui/button'
import apiCreateWorkoutInstance from '@/fetches/create-workout-instance'
import apiUpdateWorkoutInstance from '@/fetches/update-workout-instance'
import { toast } from '@/hooks/use-toast'
import { Workout, WorkoutInstance } from '@/lib/domain/workouts'
import { useForm } from 'react-hook-form'
import {
  WorkoutAccordion,
  WorkoutAccordionInstance,
} from './exercise-accordion'
import { WorkoutInstanceFormSchema, WorkoutInstanceFormValues } from './form'

export default function ClientPage({
  clientId,
  workout,
  workoutInstance,
}: {
  clientId: string
  workout: Workout
  workoutInstance?: WorkoutInstance
}) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [isFinishPending, setIsFinishPending] = useState(false)
  const handleCreateWorkoutInstance = async () => {
    setIsPending(true)
    const { data, error } = await apiCreateWorkoutInstance({ body: workout })
    if (error) {
      console.log({ error })
      setIsPending(false)
      toast({
        title: 'Failed to start workout!',
        variant: 'destructive',
        description: 'Please try again later.',
      })
      return
    }
    setIsPending(false)
    toast({
      title: 'Workout started!',
      description: 'Start logging exercises',
    })
    router.push(
      `/clients/${clientId}/programs/${workout.program_id}/workouts/${workout.id}/run/${data.id}`
    )
  }

  // finish the workout i.e. form submission
  const handleWorkoutUpdate = async (
    data: WorkoutInstanceFormValues,
    action: 'save' | 'finish'
  ) => {
    const newWorkoutInstance: WorkoutInstance = {
      ...workoutInstance!,
      end_at: action === 'finish' ? new Date().toISOString() : null,
      blocks: workoutInstance!.blocks.map((block, index) => {
        return {
          ...block,
          exercise: {
            ...block.exercise,
            sets: block.exercise.sets.map((set, setIndex) => {
              return {
                ...set,
                actual: {
                  reps: data.exercises[index].sets[setIndex].reps,
                  weight: data.exercises[index].sets[setIndex].weight,
                  rest: data.exercises[index].sets[setIndex].rest,
                  notes: data.exercises[index].sets[setIndex].notes,
                },
              }
            }),
          },
        }
      }),
    }
    // update the actual values
    if (action === 'save') {
      setIsPending(true)
    } else {
      setIsFinishPending(true)
    }
    const { error } = await apiUpdateWorkoutInstance({
      body: newWorkoutInstance,
    })
    if (error) {
      toast({
        title: 'Failed to save workout!',
        variant: 'destructive',
        description: 'Please try again later.',
      })
      setIsPending(false)
      return
    }

    if (action === 'save') {
      setIsPending(false)
      toast({
        title: 'Workout saved',
      })
    } else {
      setIsFinishPending(false)
      toast({
        title: 'Workout ended!',
        description: 'Great job!',
      })
    }
  }

  const defaultValues: WorkoutInstanceFormValues = !workoutInstance
    ? {
        exercises: workout.blocks.map((exercise) => {
          return {
            sets: Array.from({ length: Number(exercise.sets) }).map(() => ({
              exercise_id: exercise.id,
              reps: '',
              weight: '',
              rest: exercise.rest,
              notes: '',
            })),
          }
        }),
      }
    : {
        exercises: workoutInstance.blocks.map((block) => {
          return {
            sets: block.exercise.sets.map((setInfo) => ({
              exercise_id: block.exercise.id,
              reps: setInfo.actual.reps,
              weight: setInfo.actual.weight,
              rest: setInfo.actual.rest,
              notes: setInfo.actual.notes,
            })),
          }
        }),
      }
  // TODO: add default values from workoutInstance if present
  const form = useForm<WorkoutInstanceFormValues>({
    resolver: zodResolver(WorkoutInstanceFormSchema),
    defaultValues: defaultValues,
  })
  return (
    <div className="w-full space-y-2">
      <div className="flex w-full items-center justify-between">
        <Button asChild size="icon" variant="ghost">
          <Link href={`/clients/${clientId}`}>
            <Icons.arrowLeft className="h-8 w-8" />
          </Link>
        </Button>

        {!workoutInstance ? (
          <LoadingButton
            className="w-20"
            isLoading={isPending}
            variant="outline"
            onClick={() => handleCreateWorkoutInstance()}
          >
            Start
          </LoadingButton>
        ) : (
          <div className="space-x-2">
            <LoadingButton
              className="w-20"
              isLoading={isPending}
              variant="outline"
              onClick={() =>
                form.handleSubmit((data) => handleWorkoutUpdate(data, 'save'))()
              }
            >
              Save
            </LoadingButton>
            <LoadingButton
              className="w-20"
              isLoading={isFinishPending}
              variant="default"
              type="button"
              onClick={() =>
                form.handleSubmit((data) =>
                  handleWorkoutUpdate(data, 'finish')
                )()
              }
            >
              Finish
            </LoadingButton>
          </div>
        )}
      </div>
      <Tp className="text-2xl tracking-wide" variant="h2">
        {workout.name}
      </Tp>
      <div id="workout" className="">
        {workoutInstance ? (
          <WorkoutAccordionInstance
            form={form}
            workoutInstance={workoutInstance}
          />
        ) : (
          <WorkoutAccordion form={form} workout={workout} />
        )}
      </div>
    </div>
  )
}
