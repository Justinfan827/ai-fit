'use client'

import { useZEditorActions } from '@/hooks/zustand/program-editor'
import { WorkoutChange } from '@/lib/ai/tools/diff-schema'
import { JSONValue } from 'ai'
import { useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

type WorkoutDiff = {
  type: 'workout-diff'
  content: WorkoutChange[]
}

export type DataStreamDelta = WorkoutDiff

export function DataStreamHandler({
  dataStream,
}: {
  dataStream: JSONValue[] | undefined
}) {
  const lastProcessedIndex = useRef(-1)
  const { setProposedChanges } = useZEditorActions()
  useEffect(() => {
    if (!dataStream?.length) return

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1)
    lastProcessedIndex.current = dataStream.length - 1
    const newDeltasTypes = newDeltas as DataStreamDelta[]
    newDeltasTypes.forEach((delta) => {
      switch (delta.type) {
        case 'workout-diff':
          // Add unique IDs to changes if they don't already have them
          const changesWithIds = delta.content.map((change) => ({
            ...change,
            id: change.id || uuidv4(), // Add ID if it doesn't exist
          }))
          setProposedChanges(changesWithIds)
      }
    })
  }, [dataStream, setProposedChanges])

  return null
}
