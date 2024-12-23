import { Tp } from '@/components/typography'
import {
  getProgramById,
  getWorkoutInstances,
} from '@/lib/supabase/server/database.operations.queries'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import Link from 'next/link'

export async function ClientProgramWorkoutList({
  programId,
  clientId,
}: {
  programId: string
  clientId: string
}) {
  const [workouts, instances] = await Promise.all([
    getProgramById(programId),
    getWorkoutInstances(programId),
  ])

  if (workouts.error) {
    return <div>error: {workouts.error.message}</div>
  }

  if (instances.error) {
    return <div>error: {instances.error.message}</div>
  }

  const activeInstances = instances.data.filter((instance) => !instance.end_at)
  const completedInstances = instances.data.filter(
    (instance) => instance.end_at
  )

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Tp variant="h3">Active</Tp>
        <div id="history-container">
          {!activeInstances.length && (
            <div
              className="m-2 flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-neutral-800 py-4"
              id="empty-state-card"
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <p className="text-sm text-neutral-600">Start a new workout</p>
                <div className="flex max-w-[250px] justify-center text-center">
                  <p className="text-sm text-neutral-600">
                    Click on a workout below to get started with{' '}
                    <span className="font-semibold underline underline-offset-4">
                      ai powered
                    </span>{' '}
                    programming.
                  </p>
                </div>
              </div>
            </div>
          )}
          {activeInstances.map((instance, idx) => (
            <Link
              href={`/clients/${clientId}/programs/${programId}/workouts/${instance.workout_id}/run/${instance.id}`}
              key={instance.id}
              className={cn(
                'flex border-x border-b border-neutral-700 px-4 py-4 transition-colors ease-in-out hover:bg-neutral-800',
                idx === 0 && 'rounded-t-sm border-t',
                idx === instances.data.length - 1 && 'rounded-b-sm border-b'
              )}
            >
              <div>
                <p>{instance.workout_name}</p>
                <p className="font-mono text-xs text-neutral-400">
                  Day{' '}
                  {workouts.data.workouts.find(
                    (w) => w.id === instance.workout_id
                  )!.program_order + 1}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Tp variant="h3">Workouts</Tp>
        <div id="workouts-container" className="">
          {workouts.data.workouts.map((workout, idx) => (
            <Link
              href={`/clients/${clientId}/programs/${programId}/workouts/${workout.id}`}
              key={workout.id}
              className={cn(
                'flex border-x border-b border-neutral-700 px-4 py-4 transition-colors ease-in-out hover:bg-neutral-800',
                idx === 0 && 'rounded-t-sm border-t',
                idx === workouts.data.workouts.length - 1 &&
                  'rounded-b-sm border-b'
              )}
            >
              <div>
                <p>{workout.name}</p>
                <p className="font-mono text-xs text-neutral-400">
                  Day {workout.program_order + 1}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Tp variant="h3">Completed</Tp>
        <div id="history-container">
          {completedInstances.map((instance, idx) => (
            <Link
              href={`/clients/${clientId}/programs/${programId}/workouts/${instance.workout_id}/run/${instance.id}`}
              key={instance.id}
              className={cn(
                'flex border-x border-b border-neutral-700 px-4 py-2 transition-colors ease-in-out hover:bg-neutral-800',
                idx === 0 && 'rounded-t-sm border-t',
                idx === instances.data.length - 1 && 'rounded-b-sm border-b'
              )}
            >
              <div>
                <p>{instance.workout_name}</p>
                <p className="font-mono text-xs text-neutral-400">
                  {dayjs(instance.end_at).format('MMM D YYYY')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
