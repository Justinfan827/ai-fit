"use client"

import { useQuery } from "convex/react"
import Link from "next/link"
import { use } from "react"
import ProgramEditor from "@/components/grid/ProgramEditor"
import { Icons } from "@/components/icons"
import { ProgramEditorSidebar } from "@/components/program-editor-sidebar"
// import { ProgramEditorSidebar } from "@/components/program-editor-sidebar"
import { SiteHeader } from "@/components/site-header"
import { BasicSkeleton } from "@/components/skeletons/basic-skeleton"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { EditorProgramProvider } from "@/hooks/zustand/program-editor-state"
import { cn } from "@/lib/utils"
import ProgramActions from "./program-edit-actions"
import ProgramNameEditButton from "./program-name-edit-button"

export default function Page({
  params,
}: {
  params: Promise<{ programid: string }>
}) {
  const { programid } = use(params)

  // Convert programid string to Convex ID format
  const programId = programid as Id<"programs">

  // Get authenticated user
  const user = useQuery(api.users.getCurrentUser)

  // Get program data
  const program = useQuery(api.programs.getById, user ? { programId } : "skip")

  // Get exercises data
  const exercisesData = useQuery(
    api.exercises.getAllExercisesForUser,
    user ? { userId: user.id } : "skip"
  )

  // Show loading state while data is being fetched
  if (!user || program === undefined || exercisesData === undefined) {
    return (
      <SidebarProvider
        className="isolate flex flex-col"
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 120)",
            "--header-height": "calc(var(--spacing) * 16)",
          } as React.CSSProperties
        }
      >
        <SiteHeader
          className="flex w-full flex-shrink-0 items-center border-b bg-background"
          left={
            <div className="flex items-center gap-2 leading-none">
              <Link
                className="text-muted-foreground hover:text-primary"
                href="/home/programs"
              >
                Programs
              </Link>
            </div>
          }
        />
        <div className="@container/main flex flex-1">
          <SidebarInset
            className={cn("overflow-auto")}
            id="program-editor-inset"
          >
            <div className="p-4">
              <BasicSkeleton className="w-full" />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  // Handle case where program is not found
  if (program === null) {
    return (
      <SidebarProvider
        className="isolate flex flex-col"
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 120)",
            "--header-height": "calc(var(--spacing) * 16)",
          } as React.CSSProperties
        }
      >
        <SiteHeader
          className="flex w-full flex-shrink-0 items-center border-b bg-background"
          left={
            <div className="flex items-center gap-2 leading-none">
              <Link
                className="text-muted-foreground hover:text-primary"
                href="/home/programs"
              >
                Programs
              </Link>
            </div>
          }
        />
        <div className="@container/main flex flex-1">
          <SidebarInset
            className={cn("overflow-auto")}
            id="program-editor-inset"
          >
            <div className="p-4">
              <p>Program not found</p>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  const allExercises = exercisesData.custom.concat(exercisesData.base)

  return (
    <SidebarProvider
      className="isolate flex flex-col"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 120)",
          "--header-height": "calc(var(--spacing) * 16)",
        } as React.CSSProperties
      }
    >
      <EditorProgramProvider exercises={allExercises} initialProgram={program}>
        <SiteHeader
          className="flex w-full flex-shrink-0 items-center border-b bg-background"
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
          <ProgramEditorSidebar programId={programid} trainerId={user.id} />
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
            id="program-editor-inset"
          >
            <ProgramEditor />
          </SidebarInset>
        </div>
      </EditorProgramProvider>
    </SidebarProvider>
  )
}
