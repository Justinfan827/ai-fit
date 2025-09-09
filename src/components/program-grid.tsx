"use client"

import type { ReactNode } from "react"
import { EmptyStateCard } from "@/components/empty-state"
import {
  ProgramListItem,
  type ProgramListItemProps,
} from "@/components/program-list-item"
import type { SparseProgram } from "@/lib/domain/workouts"
import { cn } from "@/lib/utils"

export interface ProgramGridProps {
  programs: SparseProgram[]
  variant?: ProgramListItemProps["variant"]
  showActions?: boolean
  showTimestamp?: boolean
  linkPath?: string
  onDelete?: (programId: string) => void
  emptyState?: {
    title: string
    subtitle: string
    buttonText?: string
    buttonAction?: () => void
    actionComponent?: ReactNode
    isActionPending?: boolean
  }
  className?: string
}

export function ProgramGrid({
  programs,
  variant = "full",
  showActions = false,
  showTimestamp = true,
  linkPath = "/home/studio/:programId",
  onDelete,
  emptyState,
  className,
}: ProgramGridProps) {
  if (programs.length === 0) {
    if (!emptyState) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          No programs found
        </div>
      )
    }

    return (
      <EmptyStateCard
        actionComponent={emptyState.actionComponent}
        buttonAction={emptyState.buttonAction}
        buttonText={emptyState.buttonText}
        className={cn("w-full", className)}
        isActionPending={emptyState.isActionPending}
        subtitle={emptyState.subtitle}
        title={emptyState.title}
      />
    )
  }

  const getContainerStyles = () => {
    switch (variant) {
      case "simple":
        return "flex flex-col"
      case "compact":
        return "flex flex-col border rounded-md"
      default:
        return "flex flex-col gap-4"
    }
  }

  const getItemStyles = (index: number, total: number) => {
    if (variant === "simple") {
      const baseStyles = cn(
        index === 0 && "rounded-t-sm border-t",
        index === total - 1 && "rounded-b-sm"
      )
      return baseStyles
    }
    return ""
  }

  return (
    <div className={cn(getContainerStyles(), className)}>
      {programs.map((program, index) => (
        <ProgramListItem
          className={getItemStyles(index, programs.length)}
          key={program.id}
          linkPath={linkPath.replace(":programId", program.id)}
          onDelete={onDelete}
          program={program}
          showActions={showActions}
          showTimestamp={showTimestamp}
          variant={variant}
        />
      ))}
    </div>
  )
}
