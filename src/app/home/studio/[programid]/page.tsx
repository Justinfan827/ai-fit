import Link from "next/link"
import ProgramEditor from "@/components/grid/ProgramEditor"
import { Icons } from "@/components/icons"
import { ProgramEditorSidebar } from "@/components/program-editor-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { EditorProgramProvider } from "@/hooks/zustand/program-editor-state"
import { getCachedAuthUserT } from "@/lib/supabase/server/auth-utils"
import {
  getCachedProgramByIdT,
  getCachedUserT,
} from "@/lib/supabase/server/database.operations.queries"
import {
  getCachedAllClientDetailsT,
  getCachedAllExercisesT,
} from "@/lib/supabase/server/users/trainer-repo"
import { cn } from "@/lib/utils"
import ProgramActions from "./program-edit-actions"
import ProgramNameEditButton from "./program-name-edit-button"

export default async function Page({
  params,
}: {
  params: Promise<{ programid: string }>
}) {
  const programid = (await params).programid
  const authUser = await getCachedAuthUserT()
  const [user, exercises, clients, program] = await Promise.all([
    getCachedUserT(),
    getCachedAllExercisesT(authUser.userId),
    getCachedAllClientDetailsT(),
    getCachedProgramByIdT(programid),
  ])

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
        exercises={exercises.custom.concat(exercises.base)}
        initialProgram={program}
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
            availableClients={clients}
            exercises={exercises.custom}
            trainerId={user.id}
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
