import { getUserWorkout } from "@/lib/supabase/server/database.operations.queries"
import ClientPage from "./client-page"

export default async function SingleWorkoutPage({
  params,
}: {
  params: Promise<{
    programid: string
    workoutid: string
  }>
}) {
  const workoutid = (await params).workoutid
  const [workout] = await Promise.all([getUserWorkout(workoutid)])

  if (workout.error) {
    return <div>error: {workout.error.message}</div>
  }

  return (
    <div className="w-full space-y-2 p-2">
      <ClientPage workout={workout.data} />
    </div>
  )
}
