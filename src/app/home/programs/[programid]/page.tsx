import Link from "next/link"
import { Icons } from "@/components/icons"
import { SiteHeader } from "@/components/site-header"
import { createServerClient } from "@/lib/supabase/create-server-client"
import {
  getCurrentUser,
  getProgramById,
} from "@/lib/supabase/server/database.operations.queries"
import newTrainerRepo from "@/lib/supabase/server/users/trainer-repo"
import ClientPage from "./client-page"
import ProgramActions from "./program-edit-actions"

export default async function Page({
  params,
}: {
  params: Promise<{ programid: string }>
}) {
  const programid = (await params).programid
  const trainerRepo = newTrainerRepo()
  const serverClient = await createServerClient()
  const { data: sessiondata, error } = await serverClient.auth.getSession()
  if (error) {
    return <div>error: {error.message}</div>
  }
  if (sessiondata.session === null) {
    return <div>error: no session</div>
  }

  // First get the required data
  const [user, exercises, clients, program] = await Promise.all([
    getCurrentUser(),
    trainerRepo.getAllExercises(sessiondata.session.user.id),
    trainerRepo.fetchAllClientDetails(),
    getProgramById(programid),
  ])

  if (user.error) {
    return <div>error: {user.error.message}</div>
  }
  if (exercises.error) {
    return <div>error: {exercises.error.message}</div>
  }
  if (clients.error) {
    return <div>error: {clients.error.message}</div>
  }
  if (program.error) {
    return <div>error: {program.error.message}</div>
  }

  const programData = program.data

  return (
    <>
      <SiteHeader
        left={
          <div className="flex items-center gap-2 leading-none">
            <Link
              className="text-muted-foreground hover:text-primary"
              href="/home/programs"
            >
              Programs
            </Link>
            <Icons.chevronRight className="size-3 text-muted-foreground" />
            <p className="capitalize">{programData.name}</p>
          </div>
        }
        right={<ProgramActions />}
      />
      <div
        className="@container/main flex flex-1 flex-col"
        id="programs content"
      >
        <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
          <ClientPage
            availableClients={clients.data}
            baseExercises={exercises.data.base}
            program={programData}
            trainerExercises={exercises.data.custom}
            trainerId={user.data.sbUser.id}
          />
        </div>
      </div>
    </>
  )
}
