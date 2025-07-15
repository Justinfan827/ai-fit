"use client"

import type { JSONValue } from "ai"
import { useEffect, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import { useZEditorActions } from "@/hooks/zustand/program-editor-state"
import {
  type WorkoutChange,
  workoutChangeSchema,
} from "@/lib/ai/tools/diff-schema"
import { log } from "@/lib/logger/logger"

type WorkoutDiff = {
  type: "workout-diff"
  content: WorkoutChange[]
}

export type DataStreamDelta = WorkoutDiff

export function DataStreamHandler({
  dataStream,
}: {
  dataStream: JSONValue[] | undefined
}) {
  const lastProcessedIndex = useRef(-1)
  const { addProposedChanges } = useZEditorActions()
  useEffect(() => {
    if (!dataStream?.length) return

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1)
    lastProcessedIndex.current = dataStream.length - 1
    const newDeltasTypes = newDeltas as DataStreamDelta[]
    for (const delta of newDeltasTypes) {
      switch (delta.type) {
        case "workout-diff": {
          log.info("workout-diff", delta.content)
          const diffParsed = workoutChangeSchema.safeParse(delta.content)
          if (!diffParsed.success) {
            log.error("Diff generation caught error:", diffParsed.error)
            continue
          }
          // merge the diff into the existing proposed changes
          addProposedChanges([diffParsed.data])
          break
        }
        default: {
          throw new Error(`Unknown delta type: ${delta.type}`)
        }
      }
    }
  }, [dataStream, addProposedChanges])

  return null
}
