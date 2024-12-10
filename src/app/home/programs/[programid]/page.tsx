import WorkoutPlanEditor from '@/components/grid/workout-plan-editor'
import { getUserProgram } from '@/lib/supabase/server/database.operations.queries'

export default async function Page({
  params,
}: {
  params: Promise<{ programid: string }>
}) {
  const programid = (await params).programid
  const { data, error } = await getUserProgram(programid)
  if (error) {
    return <div>error: {error.message}</div>
  }
  return (
    <div>
      <WorkoutPlanEditor workoutPlan={data} />
    </div>
  )
}
