import { ProgramWorkoutList } from "@/components/program-workout-list"
import { ProgramNavigationMenu } from "../program-nav-menu"

export default async function WorkoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ programid: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const shouldShowNavMenu = (await searchParams)?.["nav"] === "true"
  const programId = (await params).programid
  return (
    <>
      {shouldShowNavMenu && (
        <div className="flex justify-center pt-8">
          <ProgramNavigationMenu programId={programId} />
        </div>
      )}
      <ProgramWorkoutList programId={programId} />
    </>
  )
}
