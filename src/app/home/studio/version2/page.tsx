"use client"

import * as React from "react"
import { v4 as uuidv4 } from "uuid"
import type { WorkoutGridRow } from "./types"
import { WorkoutGridV2 } from "./WorkoutGridV2"

// Sample workout rows for testing the new data model
function createSampleRows(): WorkoutGridRow[] {
  const circuitId = uuidv4()

  return [
    // Standalone exercise
    {
      id: uuidv4(),
      type: "exercise",
      exerciseId: uuidv4(),
      exerciseName: "Bench Press",
      sets: "4",
      reps: "8-10",
      weight: "135",
      rest: "90s",
      notes: "Focus on form",
      isInCircuit: false,
      order: 0,
    },
    // Another standalone exercise
    {
      id: uuidv4(),
      type: "exercise",
      exerciseId: uuidv4(),
      exerciseName: "Barbell Row",
      sets: "4",
      reps: "8-10",
      weight: "95",
      rest: "90s",
      notes: "",
      isInCircuit: false,
      order: 1,
    },
    // Circuit header
    {
      id: circuitId,
      type: "circuit-header",
      exerciseName: "Core Circuit",
      sets: "3",
      reps: "",
      weight: "",
      rest: "30s",
      notes: "Minimal rest between exercises",
      circuitId,
      circuitName: "Core Circuit",
      isInCircuit: false,
      order: 2,
    },
    // Exercise in circuit
    {
      id: uuidv4(),
      type: "exercise",
      circuitId,
      exerciseId: uuidv4(),
      exerciseName: "Plank",
      sets: "3",
      reps: "30s",
      weight: "",
      rest: "",
      notes: "",
      isInCircuit: true,
      order: 3,
    },
    // Exercise in circuit
    {
      id: uuidv4(),
      type: "exercise",
      circuitId,
      exerciseId: uuidv4(),
      exerciseName: "Russian Twist",
      sets: "3",
      reps: "20",
      weight: "15",
      rest: "",
      notes: "",
      isInCircuit: true,
      order: 4,
    },
    // Exercise in circuit
    {
      id: uuidv4(),
      type: "exercise",
      circuitId,
      exerciseId: uuidv4(),
      exerciseName: "Dead Bug",
      sets: "3",
      reps: "10 each",
      weight: "",
      rest: "",
      notes: "",
      isInCircuit: true,
      order: 5,
    },
    // One more standalone exercise
    {
      id: uuidv4(),
      type: "exercise",
      exerciseId: uuidv4(),
      exerciseName: "Face Pulls",
      sets: "3",
      reps: "15-20",
      weight: "30",
      rest: "60s",
      notes: "Squeeze at end",
      isInCircuit: false,
      order: 6,
    },
  ]
}

export default function Version2Page() {
  const [rows, setRows] = React.useState<WorkoutGridRow[]>(() =>
    createSampleRows()
  )

  const handleRowsChange = React.useCallback((newRows: WorkoutGridRow[]) => {
    setRows(newRows)
  }, [])

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="font-bold text-2xl">Workout Grid V2 (New Data Model)</h1>
        <p className="text-muted-foreground">
          Using flat row model optimized for AI-assisted editing
        </p>
      </div>

      <div className="rounded-lg border bg-background p-4">
        <div className="mb-4">
          <h2 className="font-semibold text-lg">Sample Workout</h2>
          <p className="text-muted-foreground text-sm">
            {rows.length} rows (
            {rows.filter((r) => r.type === "exercise").length} exercises)
          </p>
        </div>

        <WorkoutGridV2
          onRowsChange={handleRowsChange}
          rows={rows}
          workoutId="sample-workout"
        />
      </div>

      {/* Debug output */}
      <details className="mt-8">
        <summary className="cursor-pointer text-muted-foreground text-sm">
          Debug: Current Rows JSON
        </summary>
        <pre className="mt-2 overflow-auto rounded-lg bg-muted p-4 text-xs">
          {JSON.stringify(rows, null, 2)}
        </pre>
      </details>
    </div>
  )
}
