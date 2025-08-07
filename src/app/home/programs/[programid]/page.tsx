import Link from "next/link"
import ProgramEditor from "@/components/grid/ProgramEditor"
import { Icons } from "@/components/icons"
import { ProgramEditorSidebar } from "@/components/program-editor-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { EditorProgramProvider } from "@/hooks/zustand/program-editor-state"
import { createServerClient } from "@/lib/supabase/create-server-client"
import {
  getCurrentUser,
  getProgramById,
} from "@/lib/supabase/server/database.operations.queries"
import newTrainerRepo from "@/lib/supabase/server/users/trainer-repo"
import { cn } from "@/lib/utils"
import ClientPage from "./client-page"
import ProgramActions from "./program-edit-actions"
import ProgramNameEditButton from "./program-name-edit-button"

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
    <SidebarProvider
      className="isolate flex flex-col"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 102)",
          "--header-height": "calc(var(--spacing) * 16)",
        } as React.CSSProperties
      }
    >
      <EditorProgramProvider
        exercises={exercises.data.custom.concat(exercises.data.base)}
        initialProgram={programData}
      >
        <SiteHeader
          className="sticky top-0 z-50 flex w-full flex-shrink-0 items-center border-b bg-background"
          left={
            <div className="flex items-center gap-2 leading-none">
              <Link
                className="text-muted-foreground hover:text-primary"
                href="/home/programs"
              >
                Programs
              </Link>
              <Icons.chevronRight className="size-3 text-muted-foreground" />
              <ProgramNameEditButton />
            </div>
          }
          right={<ProgramActions />}
          triggerReplacement={
            <Button asChild size="icon" variant="ghost">
              <Link href="/home/programs">
                <Icons.arrowLeft className="size-4" />
              </Link>
            </Button>
          }
        />
        <div className="@container/main flex flex-1 flex-row-reverse">
          <ProgramEditorSidebar
            availableClients={clients.data}
            exercises={exercises.data.custom}
            trainerId={user.data.id}
          />
          {/* 
          NOTE: If SidebarInset comes before the ProgramEditorSidebar in the DOM. This breaks. CSS peer selectors
          only work when the peer element (with the peer class) comes before the element that references it.

            */}
          <SidebarInset
            className={cn(
              "overflow-auto",
              "peer-data-[variant=inset]:peer-data-[state=collapsed]:m-0!",
              "peer-data-[variant=inset]:peer-data-[state=expanded]:ml-2!",
              "peer-data-[variant=inset]:peer-data-[state=collapsed]:rounded-none!",
              "transition-all duration-300 ease-in-out"
            )}
          >
            <ProgramEditor />
          </SidebarInset>
        </div>
      </EditorProgramProvider>
    </SidebarProvider>
  )
}
