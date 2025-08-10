"use client"

import dayjs from "dayjs"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useOptimistic, useState, useTransition } from "react"
import { toast } from "sonner"
import { createProgramAction } from "@/actions/create-program"
import { deleteProgramAction } from "@/actions/delete-program"
import { EmptyStateCard } from "@/components/empty-state"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Program } from "@/lib/domain/workouts"
import { cn } from "@/lib/utils"

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
  if (optimisticPrograms.length === 0) {
    return (
      <EmptyStateCard
        buttonAction={handleNewProgram}
        buttonText="New Program"
        className="w-full"
        isActionPending={isPending}
        subtitle="Add a new program to get started with ai powered programming."
        title="Add a program"
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {optimisticPrograms.map((program) => (
        <ProgramListItem
          key={program.id}
          onDelete={onDelete}
          program={program}
        />
      ))}
    </div>
  )
}

function ProgramListItem({
  program,
  onDelete,
}: {
  program: Program
  onDelete: (programId: string) => void
}) {
  return (
    <div
      className={cn(
        "group relative flex items-center justify-between gap-2 rounded-md border px-4 py-4",
        "transition-all duration-200 ease-in-out hover:shadow-lg hover:shadow-primary/10"
      )}
    >
      <Link
        className="absolute inset-0 z-10"
        href={`/home/studio/${program.id}`}
      />
      <div className="flex items-center gap-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-muted transition-all duration-200 ease-in-out group-hover:size-8.5">
          <Icons.sparkles className="size-4 text-muted-foreground group-hover:text-primary" />
        </div>
        <div className="flex flex-col">
          <div className="font-medium">{program.name}</div>
          <div className="text-muted-foreground text-xs">
            Created {dayjs(program.created_at).format("MM/DD/YY")}
          </div>
        </div>
      </div>
      <ProgramListItemMenu onDelete={onDelete} program={program} />
    </div>
  )
}

function ProgramListItemMenu({
  program,
  onDelete,
}: {
  program: Program
  onDelete: (programId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="z-20" size="icon" variant="ghost">
            <Icons.ellipsisVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DialogTrigger asChild>
            <DropdownMenuItem className="">
              <Icons.trash className="size-4" />
              Delete
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete "{program.name}"?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this program? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={() => onDelete(program.id)} variant="destructive">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
