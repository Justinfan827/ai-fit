"use client"

import { useRouter } from "next/navigation"
import { useOptimistic, useTransition } from "react"
import { toast } from "sonner"
import { createProgramAction } from "@/actions/create-program"
import { deleteProgramAction } from "@/actions/delete-program"
import { ProgramGrid } from "@/components/program-grid"
import type { Program } from "@/lib/domain/workouts"

export function ProgramsList({ programs }: { programs: Program[] }) {
  const [optimisticPrograms, deleteOptimisticProgram] = useOptimistic(
    programs,
    (state, programId: string) => {
      return state.filter((program) => program.id !== programId)
    }
  )
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const onDelete = (programId: string) => {
    startTransition(async () => {
      try {
        deleteOptimisticProgram(programId)
        const { error } = await deleteProgramAction({ programId })
        if (error) {
          throw error
        }
        const deletedProgram = programs.find(
          (program) => program.id === programId
        )
        toast.success("Program deleted successfully", {
          description: <code className="text-xs">{deletedProgram?.name}</code>,
        })
      } catch {
        toast.error("Failed to delete program")
      }
    })
  }
  const handleNewProgram = () => {
    startTransition(async () => {
      const { data, error } = await createProgramAction({
        created_at: new Date().toISOString(),
        name: "New Program",
        type: "weekly",
        workouts: [],
      })
      if (error) {
        toast.error("Failed to create program")
      } else {
        router.push(`/home/studio/${data.id}`)
      }
    })
  }

  return (
    <ProgramGrid
      emptyState={{
        title: "Add a program",
        subtitle:
          "Add a new program to get started with ai powered programming.",
        buttonText: "New Program",
        buttonAction: handleNewProgram,
        isActionPending: isPending,
      }}
      linkPath="/home/studio/:programId"
      onDelete={onDelete}
      programs={optimisticPrograms}
      showActions={true}
      showTimestamp={true}
      variant="full"
    />
  )
}
