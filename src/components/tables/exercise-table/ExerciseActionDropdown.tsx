"use client"

import { useState } from "react"
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

interface Props {
  exercise: Exercise
  onDelete: (exerciseId: string) => void
}

type Exercise = {
  id: string
  name: string
}

export function ExerciseActionDropdown({ exercise, onDelete }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const handleOnDelete = () => {
    onDelete(exercise.id)
    setIsOpen(false)
  }
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
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DialogTrigger>
          <DropdownMenuItem>View</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete "{exercise.name}"?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this exercise? This action cannot be
            undone.
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
  )
}
