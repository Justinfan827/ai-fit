import { getUserProgram } from '@/lib/supabase/server/database.operations.queries'
import ClientPage from './client-page'

export default async function SingleWorkoutPage({
  params,
}: {
  params: Promise<{
    programid: string
    workoutid: string
  }>
}) {
  const programid = (await params).programid
  const workoutid = (await params).workoutid
  const { data, error } = await getUserProgram(programid)
  if (error) {
    return <div>error: {error.message}</div>
  }
  return (
    <div className="w-full space-y-2 p-2">
      <ClientPage workout={data.workouts[0]} />
    </div>
  )
}
