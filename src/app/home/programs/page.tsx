import { SiteHeader } from "@/components/site-header"
import { createServerClient } from "@/lib/supabase/create-server-client"
import { getUserPrograms } from "@/lib/supabase/server/database.operations.queries"
import newTrainerRepo from "@/lib/supabase/server/users/trainer-repo"
import NewProgramButton from "./new-program-button"
import { ProgramsList } from "./program-list"

export default async function WorkoutsPage() {
  const serverClient = await createServerClient()
  const { data: sessiondata, error } = await serverClient.auth.getSession()
  if (error) {
    return <div>error: {error.message}</div>
  }
  const trainerRepo = newTrainerRepo()
  if (sessiondata.session === null) {
    return <div>error: no session</div>
  }
  const [programs, exercises] = await Promise.all([
    getUserPrograms(),
    trainerRepo.getAllExercises(sessiondata.session.user.id),
  ])
  if (programs.error) {
    return <div>error: {programs.error.message}</div>
  }
  if (exercises.error) {
    return <div>error: {exercises.error.message}</div>
  }

  return (
    <>
      <SiteHeader
        left={"Programs"}
        right={<NewProgramButton exercises={exercises.data.base} />}
      />
      <div
        className="@container/main flex flex-1 flex-col"
        id="programs content"
      >
        <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
          <ProgramsList programs={programs.data} />
        </div>
      </div>
    </>
  )
}
