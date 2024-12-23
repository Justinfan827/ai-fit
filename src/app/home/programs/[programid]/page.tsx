import WorkoutPlanEditor from '@/components/grid/workout-plan-editor'
import { getProgramById } from '@/lib/supabase/server/database.operations.queries'
import { ProgramNavigationMenu } from './program-nav-menu'

export default async function Page({
  params,
}: {
  params: Promise<{ programid: string }>
}) {
  const programid = (await params).programid
  const { data, error } = await getProgramById(programid)
  if (error) {
    return <div>error: {error.message}</div>
  }
  return (
    <div>
      <div className="flex justify-center pt-8">
        <ProgramNavigationMenu programId={programid} />
      </div>
      <WorkoutPlanEditor workoutPlan={data} />
    </div>
  )
}
