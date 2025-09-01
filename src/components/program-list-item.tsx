"use client"

import dayjs from "dayjs"
import Link from "next/link"
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
import type { Program } from "@/lib/domain/workouts"
import { cn } from "@/lib/utils"

export interface ProgramListItemProps {
  program: Program
  variant?: "full" | "simple" | "compact"
  showActions?: boolean
  showTimestamp?: boolean
  linkPath?: string
  onDelete?: (programId: string) => void
  className?: string
}

export function ProgramListItem({
  program,
  variant = "full",
  showActions = false,
  showTimestamp = true,
  linkPath = `/home/studio/${program.id}`,
  onDelete,
  className,
}: ProgramListItemProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "simple":
        return "border-neutral-700 border-x border-b px-4 py-4 hover:bg-muted/50"
      case "compact":
        return "border-b px-2 py-2 hover:bg-muted/30"
      default:
        return "group relative flex items-center justify-between gap-2 rounded-md border px-4 py-4 transition-all duration-200 ease-in-out hover:shadow-lg hover:shadow-primary/10"
    }
  }

  const renderContent = () => {
    if (variant === "simple" || variant === "compact") {
      return (
        <div className="flex w-full items-center justify-between">
          <div className="font-medium">{program.name}</div>
          {showTimestamp && variant !== "compact" && (
            <div className="text-muted-foreground text-xs">
              {dayjs(program.created_at).format("MM/DD/YY")}
            </div>
          )}
        </div>
      )
    }

    return (
      <>
        <div className="flex items-center gap-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted transition-all duration-200 ease-in-out group-hover:size-8.5">
            <Icons.sparkles className="size-4 text-muted-foreground group-hover:text-primary" />
          </div>
          <div className="flex flex-col">
            <div className="font-medium">{program.name}</div>
            {showTimestamp && (
              <div className="text-muted-foreground text-xs">
                Created {dayjs(program.created_at).format("MM/DD/YY")}
              </div>
            )}
          </div>
        </div>
        {showActions && onDelete && (
          <ProgramListItemMenu onDelete={onDelete} program={program} />
        )}
      </>
    )
  }

  return (
    <div className={cn(getVariantStyles(), className)}>
      <Link
        className={cn(variant === "full" ? "absolute inset-0 z-10" : "flex-1")}
        href={linkPath}
      />
      {renderContent()}
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
            <DropdownMenuItem>
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
