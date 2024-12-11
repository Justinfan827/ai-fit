import { Typography } from '@/components/typography'
import {
  getUserProgram,
  getWorkoutInstances,
} from '@/lib/supabase/server/database.operations.queries'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ programid: string }>
}) {
  const programid = (await params).programid

  const [workouts, instances] = await Promise.all([
    getUserProgram(programid),
    getWorkoutInstances(programid),
  ])

  if (workouts.error) {
    return <div>error: {workouts.error.message}</div>
  }

  if (instances.error) {
    return <div>error: {instances.error.message}</div>
  }
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pt-6">
      <div className="space-y-4">
        <Typography variant="h3">Workouts</Typography>
        <div id="workouts-container" className="">
          {workouts.data.workouts.map((workout, idx) => (
            <Link
              href={`/home/programs/${programid}/workouts/${workout.id}`}
              key={workout.id}
              className={cn(
                'flex border-x border-b border-neutral-700 px-4 py-4 transition-colors ease-in-out hover:bg-neutral-800',
                idx === 0 && 'rounded-t-sm border-t',
                idx === workouts.data.workouts.length - 1 &&
                  'rounded-b-sm border-b'
              )}
            >
              {workout.name}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <Typography variant="h3">History</Typography>
        <div id="history-container">
          {instances.data.map((instance, idx) => (
            <Link
              href={`/home/programs/${programid}/workouts/${instance.workout_id}/run/${instance.id}`}
              key={instance.id}
              className={cn(
                'flex border-x border-b border-neutral-700 px-4 py-4 transition-colors ease-in-out hover:bg-neutral-800',
                idx === 0 && 'rounded-t-sm border-t',
                idx === instances.data.length - 1 && 'rounded-b-sm border-b'
              )}
            >
              <div>{instance.workout_name}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
