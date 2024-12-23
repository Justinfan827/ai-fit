import {
  getLatestWorkoutInstance,
  getUserWorkout,
} from '@/lib/supabase/server/database.operations.queries'
import ClientPage from '../../client-page'

export default async function SingleWorkoutPage({
  params,
}: {
  params: Promise<{
    clientId: string
    programId: string
    workoutId: string
  }>
}) {
  const clientid = (await params).clientId
  const workoutid = (await params).workoutId

  const [workout, instance] = await Promise.all([
    getUserWorkout(workoutid),
    getLatestWorkoutInstance(workoutid),
  ])
  if (workout.error) {
    return <div>error: {workout.error.message}</div>
  }
  if (instance.error) {
    return <div>instance error: {instance.error.message}</div>
  }

  return (
    <div className="w-full">
      <ClientPage
        clientId={clientid}
        workout={workout.data}
        workoutInstance={instance.data}
      />
    </div>
  )
}
