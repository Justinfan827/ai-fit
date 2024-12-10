'use client'
import { Icons } from '@/components/icons'
import { Typography } from '@/components/typography'
import { Button } from '@/components/ui/button'
import apiCreateWorkoutInstance from '@/fetches/create-workout-instance'
import { toast } from '@/hooks/use-toast'
import { Workout } from '@/lib/domain/workouts'
import { WorkoutAccordion } from './exercise-accordion'

export default function ClientPage({ workout }: { workout: Workout }) {
  const handleStartWorkout = async (workout: Workout) => {
    const { error } = await apiCreateWorkoutInstance({ body: workout })
    if (error) {
      console.log({ error })
      toast({
        title: 'Failed to start workout!',
        variant: 'destructive',
        description: 'Please try again later.',
      })
    }
  }
  return (
    <div className="w-full space-y-2">
      <div className="flex w-full items-center justify-between">
        <Button size="icon" variant="ghost">
          <Icons.arrowLeft className="h-8 w-8" />
        </Button>
        <Button variant="outline" onClick={() => handleStartWorkout(workout)}>
          Start
        </Button>
      </div>
      <Typography className="text-2xl tracking-wide" variant="h2">
        {workout.name}
      </Typography>
      <div id="workout" className="">
        <WorkoutAccordion workout={workout} />
      </div>
    </div>
  )
}
