"use client"

import { useCallback, useEffect, useMemo } from "react"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  useZCurrentChangeId,
  useZEditorActions,
  useZProposedChanges,
} from "@/hooks/zustand/program-editor"
import { cn } from "@/lib/utils"

interface ProposedChangesMenuProps {
  className?: string
}

export function ProposedChangesMenu({ className }: ProposedChangesMenuProps) {
  const proposedChanges = useZProposedChanges()
  const {
    setProposedChanges,
    setCurrentChangeId,
    applyPendingProposalById,
    rejectPendingProposalById,
  } = useZEditorActions()
  const currentChangeId = useZCurrentChangeId()

  const hasChanges = proposedChanges.length > 0

  // Find current change index based on the current change ID
  const currentChangeIndex = useMemo(() => {
    if (!currentChangeId) return 0
    const index = proposedChanges.findIndex(
      (change) => change.id === currentChangeId
    )
    return index >= 0 ? index : 0
  }, [currentChangeId, proposedChanges])

  const currentChange = proposedChanges[currentChangeIndex]

  // Set the first change as current when changes are available and none is selected
  useEffect(() => {
    if (hasChanges && !currentChangeId && proposedChanges.length > 0) {
      setCurrentChangeId(proposedChanges[0].id)
    } else if (!hasChanges && currentChangeId) {
      setCurrentChangeId(null)
    }
  }, [hasChanges, currentChangeId, proposedChanges, setCurrentChangeId])

  const acceptChange = useCallback(
    (changeId: string) => {
      // Remove the pending status from the workout
      applyPendingProposalById(changeId)

      // Update current change ID
      if (proposedChanges.length > 0) {
        // If there are still changes, set the next one as current
        const nextIndex = Math.min(
          currentChangeIndex + 1,
          proposedChanges.length - 1
        )
        setCurrentChangeId(proposedChanges[nextIndex].id)
      } else {
        // No more changes
        setCurrentChangeId(null)
      }
    },
    [
      proposedChanges,
      currentChangeIndex,
      setProposedChanges,
      setCurrentChangeId,
      applyPendingProposalById,
    ]
  )

  const rejectChange = useCallback(
    (changeId: string) => {
      // Use the rejectProposal action which handles reverting changes and removing from proposals
      rejectPendingProposalById(changeId)

      // Update current change ID
      const updatedChanges = proposedChanges.filter(
        (change) => change.id !== changeId
      )

      if (updatedChanges.length > 0) {
        // If there are still changes, set the next one as current
        const nextIndex = Math.min(
          currentChangeIndex,
          updatedChanges.length - 1
        )
        setCurrentChangeId(updatedChanges[nextIndex].id)
      } else {
        // No more changes
        setCurrentChangeId(null)
      }
    },
    [
      proposedChanges,
      currentChangeIndex,
      rejectPendingProposalById,
      setCurrentChangeId,
    ]
  )

  const acceptAllChanges = useCallback(() => {
    // Remove pending status for all changes
    proposedChanges.forEach((change) => {
      applyPendingProposalById(change.id)
    })

    setProposedChanges([])
    setCurrentChangeId(null)
  }, [
    proposedChanges,
    applyPendingProposalById,
    setProposedChanges,
    setCurrentChangeId,
  ])

  const rejectAllChanges = useCallback(() => {
    // Use rejectProposal for each change to revert them
    proposedChanges.forEach((change) => {
      rejectPendingProposalById(change.id)
    })

    setCurrentChangeId(null)
  }, [proposedChanges, rejectPendingProposalById, setCurrentChangeId])

  const navigateToNext = useCallback(() => {
    if (proposedChanges.length > 0) {
      const nextIndex = (currentChangeIndex + 1) % proposedChanges.length
      setCurrentChangeId(proposedChanges[nextIndex].id)
    }
  }, [proposedChanges, currentChangeIndex, setCurrentChangeId])

  const navigateToPrevious = useCallback(() => {
    if (proposedChanges.length > 0) {
      const prevIndex =
        (currentChangeIndex - 1 + proposedChanges.length) %
        proposedChanges.length
      setCurrentChangeId(proposedChanges[prevIndex].id)
    }
  }, [proposedChanges, currentChangeIndex, setCurrentChangeId])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasChanges) return

      // Cmd+Y to accept current change
      if (e.metaKey && e.key === "y" && currentChange) {
        e.preventDefault()
        acceptChange(currentChange.id)
      }
      // Cmd+N to reject current change
      else if (e.metaKey && e.key === "n" && currentChange) {
        e.preventDefault()
        rejectChange(currentChange.id)
      }
      // Cmd+Shift+Enter to accept all changes
      // else if (e.metaKey && e.shiftKey && e.key === 'Enter') {
      //   e.preventDefault()
      //   acceptAllChanges()
      // }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    hasChanges,
    currentChange,
    acceptChange,
    rejectChange,
    acceptAllChanges,
    navigateToNext,
    navigateToPrevious,
  ])

  if (!hasChanges) return null
  return (
    <div
      className={cn(
        "-translate-x-1/2 fixed bottom-4 left-1/2 z-50 transform",
        "rounded-lg border border-neutral-700 bg-neutral-900 shadow-lg",
        "min-w-[400px] max-w-[600px] p-4",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-200 text-sm">
            Pending Changes
          </span>
          <Badge className="text-xs" variant="outline">
            {proposedChanges.length} changes to approve
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            className="h-8 text-neutral-400 hover:text-neutral-200"
            disabled={proposedChanges.length <= 1}
            onClick={navigateToPrevious}
            size="sm"
            variant="ghost"
          >
            <Icons.chevronLeft className="h-4 w-4" />
          </Button>
          <Button
            className="h-8 text-neutral-400 hover:text-neutral-200"
            disabled={proposedChanges.length <= 1}
            onClick={navigateToNext}
            size="sm"
            variant="ghost"
          >
            <Icons.chevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="h-8 border-red-500/50 text-red-400 hover:bg-red-500/10"
            onClick={() => currentChange && rejectChange(currentChange.id)}
            size="sm"
            variant="outline"
          >
            <Icons.x className="mr-1 h-3 w-3" />
            Reject
            <span className="ml-1 text-xs opacity-70">⌘N</span>
          </Button>
          <Button
            className="h-8 border-green-500/50 text-green-400 hover:bg-green-500/10"
            onClick={() => currentChange && acceptChange(currentChange.id)}
            size="sm"
            variant="outline"
          >
            <Icons.check className="mr-1 h-3 w-3" />
            Accept
            <span className="ml-1 text-xs opacity-70">⌘Y</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
