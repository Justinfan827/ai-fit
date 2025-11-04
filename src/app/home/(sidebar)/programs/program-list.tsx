"use client"

import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { toast } from "sonner"
import { ProgramGrid } from "@/components/program-grid"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import type { Program } from "@/lib/domain/workouts"

interface ProgramsListProps {
  programs: Program[]
  emptyState?: {
    title: string
    subtitle: string
    buttonText?: string
    buttonAction?: () => void
    actionComponent?: ReactNode
    isActionPending?: boolean
  }
}

export function ProgramsList({ programs, emptyState }: ProgramsListProps) {
  const router = useRouter()
  const deleteProgram = useMutation(api.programs.deleteProgram)
  const createProgram = useMutation(api.programs.create)

  const onDelete = async (programId: string) => {
    try {
      await deleteProgram({ programId: programId as Id<"programs"> })
      const deletedProgram = programs.find(
        (program) => program.id === programId
      )
      toast.success("Program deleted successfully", {
        description: <code className="text-xs">{deletedProgram?.name}</code>,
      })
    } catch {
      toast.error("Failed to delete program")
    }
  }
  const handleNewProgram = async () => {
    try {
      const data = await createProgram({
        name: "New Program",
        type: "splits",
        workouts: [],
      })
      router.push(`/home/studio/${data.id}`)
    } catch {
      toast.error("Failed to create program")
    }
  }

  return (
    <ProgramGrid
      emptyState={
        emptyState ?? {
          title: "Add a program",
          subtitle:
            "Add a new program to get started with ai powered programming.",
          buttonText: "New Program",
          buttonAction: handleNewProgram,
        }
      }
      linkPath="/home/studio/:programId"
      onDelete={onDelete}
      programs={programs}
      showActions={true}
      showTimestamp={true}
      variant="full"
    />
  )
}
