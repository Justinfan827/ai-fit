"use client"

import { useState } from "react"
import { ExerciseDetailsModal } from "@/components/forms/ExerciseDetailsModal"
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
import type { TableExercise } from "./types"

interface Props {
  exercise: TableExercise
  onDelete: (exerciseId: string) => void
  onExerciseUpdated?: () => void
}

export function ExerciseActionDropdown({
  exercise,
  onDelete,
  onExerciseUpdated,
}: Props) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const handleOnDelete = () => {
    onDelete(exercise.id)
    setIsDeleteDialogOpen(false)
  }

  const handleViewExercise = () => {
    setIsDetailsModalOpen(true)
  }
  return (
    <>
      <Dialog onOpenChange={setIsDeleteDialogOpen} open={isDeleteDialogOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="z-20" size="icon" variant="ghost">
              <Icons.ellipsisVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleViewExercise}>
              <Icons.view className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            {exercise.isCustom && (
              <DialogTrigger asChild>
                <DropdownMenuItem>
                  <Icons.delete className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DialogTrigger>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete "{exercise.name}"?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this exercise? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleOnDelete} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ExerciseDetailsModal
        exercise={exercise}
        onExerciseUpdated={onExerciseUpdated}
        onOpenChange={setIsDetailsModalOpen}
        open={isDetailsModalOpen}
      />
    </>
  )
}
