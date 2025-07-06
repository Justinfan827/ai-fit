'use client'

import { Icons } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useZEditorActions,
  useZProposedChanges,
} from '@/hooks/zustand/program-editor'
import { WorkoutChange } from '@/lib/ai/tools/diff-schema'
import { cn } from '@/lib/utils'
import { useCallback, useEffect, useState } from 'react'

interface ProposedChangesMenuProps {
  className?: string
}

export function ProposedChangesMenu({ className }: ProposedChangesMenuProps) {
  const proposedChanges = useZProposedChanges()
  const { setProposedChanges } = useZEditorActions()
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0)

  const hasChanges = proposedChanges.length > 0
  const currentChange = proposedChanges[currentChangeIndex]

  const acceptChange = useCallback(
    (changeId: string) => {
      // Remove the accepted change from the list
      const updatedChanges = proposedChanges.filter(
        (change) => change.id !== changeId
      )
      setProposedChanges(updatedChanges)

      // Update current index if needed
      if (
        currentChangeIndex >= updatedChanges.length &&
        updatedChanges.length > 0
      ) {
        setCurrentChangeIndex(updatedChanges.length - 1)
      } else if (updatedChanges.length === 0) {
        setCurrentChangeIndex(0)
      }
    },
    [proposedChanges, currentChangeIndex, setProposedChanges]
  )

  const rejectChange = useCallback(
    (changeId: string) => {
      // Remove the rejected change from the list
      const updatedChanges = proposedChanges.filter(
        (change) => change.id !== changeId
      )
      setProposedChanges(updatedChanges)

      // Update current index if needed
      if (
        currentChangeIndex >= updatedChanges.length &&
        updatedChanges.length > 0
      ) {
        setCurrentChangeIndex(updatedChanges.length - 1)
      } else if (updatedChanges.length === 0) {
        setCurrentChangeIndex(0)
      }
    },
    [proposedChanges, currentChangeIndex, setProposedChanges]
  )

  const acceptAllChanges = useCallback(() => {
    setProposedChanges([])
    setCurrentChangeIndex(0)
  }, [setProposedChanges])

  const rejectAllChanges = useCallback(() => {
    setProposedChanges([])
    setCurrentChangeIndex(0)
  }, [setProposedChanges])

  const navigateToNext = useCallback(() => {
    if (proposedChanges.length > 0) {
      setCurrentChangeIndex((prev) => (prev + 1) % proposedChanges.length)
    }
  }, [proposedChanges.length])

  const navigateToPrevious = useCallback(() => {
    if (proposedChanges.length > 0) {
      setCurrentChangeIndex(
        (prev) => (prev - 1 + proposedChanges.length) % proposedChanges.length
      )
    }
  }, [proposedChanges.length])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasChanges) return

      // Cmd+Y to accept current change
      if (e.metaKey && e.key === 'y' && currentChange) {
        e.preventDefault()
        acceptChange(currentChange.id)
      }
      // Cmd+N to reject current change
      else if (e.metaKey && e.key === 'n' && currentChange) {
        e.preventDefault()
        rejectChange(currentChange.id)
      }
      // Cmd+Shift+Enter to accept all changes
      else if (e.metaKey && e.shiftKey && e.key === 'Enter') {
        e.preventDefault()
        acceptAllChanges()
      }
      // Arrow keys to navigate
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        navigateToPrevious()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        navigateToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    hasChanges,
    currentChange,
    acceptChange,
    rejectChange,
    acceptAllChanges,
    navigateToNext,
    navigateToPrevious,
  ])

  // Reset current index when changes are updated externally
  useEffect(() => {
    if (currentChangeIndex >= proposedChanges.length) {
      setCurrentChangeIndex(Math.max(0, proposedChanges.length - 1))
    }
  }, [proposedChanges.length, currentChangeIndex])

  if (!hasChanges) return null

  const getChangeDescription = (change: WorkoutChange) => {
    switch (change.type) {
      case 'add-block':
        return `Add ${change.block.type} block`
      case 'remove-block':
        return `Remove block at index ${change.blockIndex}`
      case 'update-block':
        return `Update ${change.block.type} block`
      case 'add-circuit-exercise':
        return `Add exercise to circuit`
      case 'remove-circuit-exercise':
        return `Remove exercise from circuit`
      case 'update-circuit-exercise':
        return `Update exercise in circuit`
      default:
        return 'Unknown change'
    }
  }

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'add-block':
      case 'add-circuit-exercise':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'remove-block':
      case 'remove-circuit-exercise':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'update-block':
      case 'update-circuit-exercise':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform',
        'rounded-lg border border-neutral-700 bg-neutral-900 shadow-lg',
        'max-w-[600px] min-w-[400px] p-4',
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.spinner className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-medium text-neutral-200">
            Pending Changes
          </span>
          <Badge variant="outline" className="text-xs">
            {currentChangeIndex + 1} of {proposedChanges.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-neutral-400 hover:text-neutral-200"
          onClick={rejectAllChanges}
        >
          <Icons.x className="h-4 w-4" />
        </Button>
      </div>

      {currentChange && (
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('text-xs', getChangeTypeColor(currentChange.type))}
            >
              {currentChange.type.replace('-', ' ')}
            </Badge>
            <span className="text-sm text-neutral-300">
              {getChangeDescription(currentChange)}
            </span>
          </div>
          <div className="text-xs text-neutral-400">
            Workout {currentChange.workoutIndex + 1}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={navigateToPrevious}
            disabled={proposedChanges.length <= 1}
            className="h-8 text-neutral-400 hover:text-neutral-200"
          >
            <Icons.chevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={navigateToNext}
            disabled={proposedChanges.length <= 1}
            className="h-8 text-neutral-400 hover:text-neutral-200"
          >
            <Icons.chevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => currentChange && rejectChange(currentChange.id)}
            className="h-8 border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <Icons.x className="mr-1 h-3 w-3" />
            Reject
            <span className="ml-1 text-xs opacity-70">⌘N</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => currentChange && acceptChange(currentChange.id)}
            className="h-8 border-green-500/50 text-green-400 hover:bg-green-500/10"
          >
            <Icons.check className="mr-1 h-3 w-3" />
            Accept
            <span className="ml-1 text-xs opacity-70">⌘Y</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={acceptAllChanges}
            className="h-8 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
          >
            <Icons.checkCircle className="mr-1 h-3 w-3" />
            Accept All
            <span className="ml-1 text-xs opacity-70">⌘⇧⏎</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
