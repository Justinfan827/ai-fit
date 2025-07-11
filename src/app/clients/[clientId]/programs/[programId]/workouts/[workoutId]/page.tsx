import { getUserWorkout } from "@/lib/supabase/server/database.operations.queries"
import ClientPage from "./client-page"

export default async function ClientWorkoutPage({
  params,
}: {
  params: Promise<{
    programId: string
    workoutId: string
    clientId: string
  }>
}) {
  const workoutid = (await params).workoutId
  const clientId = (await params).clientId
  const [workout] = await Promise.all([getUserWorkout(workoutid)])

  if (workout.error) {
    return <div>error: {workout.error.message}</div>
  }

  return (
    <div className="w-full space-y-2 p-2">
      <ClientPage clientId={clientId} workout={workout.data} />
    </div>
  )
}
