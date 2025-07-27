import { Logo } from "@/components/icons"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { createServerClient } from "@/lib/supabase/create-server-client"
import {
  getCurrentUser,
  getExercises,
  getProgramById,
} from "@/lib/supabase/server/database.operations.queries"
import newTrainerRepo from "@/lib/supabase/server/users/trainer-repo"
import ClientPage from "./client-page"

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
    <SidebarProvider>
      <div className="w-full overflow-auto">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <div className="flex items-center">
            <Logo />
            <Separator className="mx-4 h-6" orientation="vertical" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/home">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/home/programs">
                    Programs
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{programData.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <SidebarTrigger className="-ml-1" />
        </header>
        <ClientPage
          availableClients={clients.data}
          baseExercises={exercises.data.base}
          program={programData}
          trainerExercises={exercises.data.custom}
          trainerId={user.data.sbUser.id}
        />
      </div>
    </SidebarProvider>
  )
}
