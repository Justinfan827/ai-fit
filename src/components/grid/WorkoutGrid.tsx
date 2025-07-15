import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react"
import { v4 as uuidv4 } from "uuid"

import { DebugToggle } from "@/components/debug-toggle"
import AddRowDropdown from "@/components/grid/AddRowDropdown"
import ExerciseInput from "@/components/grid/ExerciseInput"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  useWorkoutHistoryKeyboardShortcuts,
  useZCurrentChangeId,
  useZEditorActions,
} from "@/hooks/zustand/program-editor"
import type {
  CircuitBlock,
  Exercise,
  ExerciseBlock,
  Workout,
} from "@/lib/domain/workouts"
import log from "@/lib/logger/logger"
import { cn } from "@/lib/utils"
import type { Column } from "./columns"

// Utility function for getting row-specific styling
function getRowStyles(cell: Cell, currentChangeId: string | null) {
  return {
    // Circuit header styles
    circuitHeader: cell.isCircuitHeader,
    // Circuit exercise styles
    circuitExercise: cell.isCircuitExercise,
    // Standalone exercise styles
    standaloneExercise: !(cell.isCircuitHeader || cell.isCircuitExercise),
    // Proposed change styles
    proposedChange: cell.isProposed,
    // Current change styles (highlighted more prominently)
    currentChange:
      cell.isProposed && cell.pendingStatus?.proposalId === currentChangeId,
  }
}

// Utility function for getting cell CSS classes
function getCellClasses(
  cell: Cell,
  baseClasses: string,
  currentChangeId: string | null
) {
  const styles = getRowStyles(cell, currentChangeId)

  return cn(
    baseClasses,
    // Current change styling (takes highest precedence)
    styles.currentChange &&
      cell.proposedChangeType === "adding" &&
      "border-green-400/70 bg-green-800/50 ring-1 ring-green-400/30",
    styles.currentChange &&
      cell.proposedChangeType === "adding" &&
      cell.colIndex === 0 &&
      "shadow-[-3px_0_0_0_rgb(34_197_94_/_0.9)]",
    // Current change removal styling
    styles.currentChange &&
      cell.proposedChangeType === "removing" &&
      "border-red-400/70 bg-red-800/50 opacity-90 ring-1 ring-red-400/30",
    styles.currentChange &&
      cell.proposedChangeType === "removing" &&
      cell.colIndex === 0 &&
      "shadow-[-3px_0_0_0_rgb(239_68_68_/_0.9)]",
    // Current change update styling
    styles.currentChange &&
      cell.proposedChangeType === "updating" &&
      "border-blue-400/70 bg-blue-800/50 ring-1 ring-blue-400/30",
    styles.currentChange &&
      cell.proposedChangeType === "updating" &&
      cell.colIndex === 0 &&
      "shadow-[-3px_0_0_0_rgb(59_130_246_/_0.9)]",
    // Regular proposed change styling (lower precedence)
    !styles.currentChange &&
      styles.proposedChange &&
      cell.proposedChangeType === "adding" &&
      "border-green-500/50 bg-green-950/30",
    !styles.currentChange &&
      styles.proposedChange &&
      cell.proposedChangeType === "adding" &&
      cell.colIndex === 0 &&
      "shadow-[-2px_0_0_0_rgb(34_197_94_/_0.7)]",
    // Proposed removal styling
    !styles.currentChange &&
      styles.proposedChange &&
      cell.proposedChangeType === "removing" &&
      "border-red-500/50 bg-red-950/30 opacity-75",
    !styles.currentChange &&
      styles.proposedChange &&
      cell.proposedChangeType === "removing" &&
      cell.colIndex === 0 &&
      "shadow-[-2px_0_0_0_rgb(239_68_68_/_0.7)]",
    // Proposed update styling
    !styles.currentChange &&
      styles.proposedChange &&
      cell.proposedChangeType === "updating" &&
      "border-blue-500/50 bg-blue-950/30",
    !styles.currentChange &&
      styles.proposedChange &&
      cell.proposedChangeType === "updating" &&
      cell.colIndex === 0 &&
      "shadow-[-2px_0_0_0_rgb(59_130_246_/_0.7)]",

    // Circuit header styling
    !styles.proposedChange &&
      styles.circuitHeader &&
      "bg-neutral-900 font-medium text-orange-400",
    !styles.proposedChange &&
      styles.circuitHeader &&
      cell.colIndex === 0 &&
      "shadow-[-2px_0_0_0_rgb(251_146_60_/_0.5)]",
    // Circuit exercise styling - subtle background with left border accent
    !styles.proposedChange &&
      styles.circuitExercise &&
      cell.colIndex === 0 &&
      "bg-neutral-925 shadow-[-2px_0_0_0_rgb(251_146_60_/_0.5)]",
    // Standalone exercise styling (default)
    !styles.proposedChange && styles.standaloneExercise && "bg-neutral-950"
  )
}

interface Position {
  row: number
  col: number
}

interface CellChange {
  type: "cell"
  cell: Cell
  oldValue: string
  newValue: string
}

interface ExerciseSelection {
  type: "exercise-selection"
  cell: Cell
  exercise: {
    id: string
    name: string
  }
  oldExercise: {
    id: string
    name: string
  }
}

type GridChange = CellChange | ExerciseSelection

// Type guard functions
function isExerciseSelection(change: GridChange): change is ExerciseSelection {
  return "type" in change && change.type === "exercise-selection"
}

function isCellChange(change: GridChange): change is CellChange {
  return "type" in change && change.type === "cell"
}

interface Cell {
  type: "input" | "select" | "display"
  value: string
  colType: string
  width: number
  rowIndex: number
  colIndex: number
  isCircuitHeader?: boolean
  blockType?: "exercise" | "circuit"
  originalBlockIndex?: number
  readOnly?: boolean
  isCircuitExercise?: boolean
  exerciseIndexInCircuit?: number // Add this property
  // Proposed change properties
  isProposed?: boolean
  proposedChangeIndex?: number
  proposedChangeType?: "adding" | "removing" | "updating"
  // Flag to track if this is an individual exercise change (not part of circuit change)
  isIndividualChange?: boolean
  // Pending status for proposal management
  pendingStatus?: {
    type: "adding" | "removing" | "updating"
    proposalId: string
  }
}

interface WorkoutGridProps {
  workout: Workout
  onWorkoutChange: (workout: Workout) => void
  columns: Column[]
  onProposalAction?: (proposalId: string, action: "accept" | "reject") => void
}

export default function WorkoutGrid({
  workout,
  onWorkoutChange,
  columns,
  onProposalAction,
}: WorkoutGridProps) {
  const [showDebug, setShowDebug] = useState(false)
  const { saveWorkoutToHistory } = useZEditorActions()

  // Enable keyboard shortcuts for this workout
  useWorkoutHistoryKeyboardShortcuts(workout.id)

  const handleWorkoutChange = (newWorkout: Workout) => {
    // Save current state to history before making changes
    saveWorkoutToHistory(workout.id, newWorkout)
    onWorkoutChange(newWorkout)
  }

  return (
    <div className="text-sm">
      <GridHeaderRow columns={columns} />
      <GridContentRows
        columns={columns}
        onProposalAction={onProposalAction}
        onWorkoutChange={handleWorkoutChange}
        workout={workout}
      />
      {showDebug && (
        <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
          <h3 className="mb-2 font-medium text-neutral-400 text-sm">
            Debug: Current Workout
          </h3>
          <pre className="overflow-auto text-neutral-300 text-xs">
            {JSON.stringify(workout, null, 2)}
          </pre>
        </div>
      )}
      <DebugToggle onToggle={setShowDebug} />
    </div>
  )
}

function GridHeaderRow({ columns }: { columns: Column[] }) {
  return (
    <div className="flex w-full" id="headers">
      <div className="ml-[48px] flex px-2" id="dummy-action-menu" />
      {columns.map((col, idx) => {
        return (
          <div
            className={cn(
              "shrink-0 grow border-neutral-800 border-t border-r bg-neutral-950 p-2 font-light text-neutral-400 text-sm uppercase tracking-wider",
              idx === 0 && "rounded-tl-sm border-l",
              idx === columns.length - 1 && "rounded-tr-sm"
            )}
            key={col.field}
            style={{ flexBasis: col.width }}
          >
            {col.header}
          </div>
        )
      })}
    </div>
  )
}

function GridContentRows({
  columns,
  workout,
  onWorkoutChange,
  onProposalAction,
}: {
  columns: Column[]
  workout: Workout
  onWorkoutChange: (wrk: Workout) => void
  onProposalAction?: (proposalId: string, action: "accept" | "reject") => void
}) {
  // Create grid directly from workout
  const grid = createGridFromWorkoutWithChanges(workout, columns)
  const numRows = grid.length
  const numCols = columns.length
  const [activeCell, setActiveCell] = useState<Position | null>(null)
  const [openDropdownRow, setOpenDropdownRow] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState<string>("")
  const [originalValue, setOriginalValue] = useState<string>("")
  const gridRefs = useRef<HTMLDivElement[][]>([])
  const currentChangeId = useZCurrentChangeId()

  // Scroll to current change when it changes
  useEffect(() => {
    if (currentChangeId) {
      // Find the first row that matches the current change
      const currentChangeRowIndex = grid.findIndex((row) =>
        row.some((cell) => cell.pendingStatus?.proposalId === currentChangeId)
      )

      if (
        currentChangeRowIndex >= 0 &&
        gridRefs.current[currentChangeRowIndex]?.[0]
      ) {
        // Scroll the first cell of the matching row into view
        gridRefs.current[currentChangeRowIndex][0].scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        })
      }
    }
  }, [currentChangeId, grid])

  // Incremental update handler
  const handleGridChange = (change: GridChange) => {
    const updatedWorkout = applyIncrementalChange(change, workout)
    onWorkoutChange(updatedWorkout)
  }

  // Save the current editing changes
  const saveChanges = (row: number, col: number) => {
    if (activeCell && editingValue !== originalValue) {
      const cell = grid[row][col]
      const change: CellChange = {
        type: "cell",
        cell,
        oldValue: originalValue,
        newValue: editingValue,
      }
      handleGridChange(change)
    }
  }

  // Start editing a cell
  const startEditing = (row: number, col: number, initialValue?: string) => {
    const cell = grid[row][col]
    const currentValue = cell.value || ""
    setActiveCell({ row, col })
    setOriginalValue(currentValue)
    setEditingValue(initialValue !== undefined ? initialValue : currentValue)
  }

  // Stop editing and save changes
  const stopEditing = (row: number, col: number) => {
    saveChanges(row, col)
    setActiveCell(null)
    setEditingValue("")
    setOriginalValue("")
  }

  const handleKeyDown = (e: KeyboardEvent, row: number, col: number) => {
    if (activeCell) {
      if (e.key === "Tab" && e.shiftKey) {
        // idk if we need this
        //e.preventDefault()
        //const newCol = Math.max(0, col - 1)
        //setActiveCell(null)
        //gridRefs.current[row][newCol]?.focus()
      } else if (e.key === "Enter") {
        e.preventDefault()
        stopEditing(row, col)
        const nextRow = Math.min(numRows - 1, row + 1)
        /*
         Use setTimeout to delay focus until after re-render! Here's an explanation:
         The issue is that:
         stopEditing(row, col) is called first
         stopEditing calls saveChanges
         saveChanges calls handleGridChange which calls onWorkoutChange
         onWorkoutChange triggers a re-render of the component
         The re-render happens before the gridRefs.current[nextRow][col]?.focus() line executes or takes effect
         During the re-render, the grid is rebuilt and the refs are reset
         By the time focus is attempted, the reference may be stale or the element may have been remounted
        */
        setTimeout(() => {
          gridRefs.current[nextRow]?.[col]?.focus()
        }, 0)
      } else if (e.key === "Escape") {
        e.preventDefault()
        setActiveCell(null)
        setEditingValue("")
        setOriginalValue("")
        gridRefs.current[row][col]?.focus()
      }
      return
    }

    // Handle navigation when no cell is active
    const isArrowKey = [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ].includes(e.key)

    if (isArrowKey) {
      e.preventDefault()
      let newRow = row
      let newCol = col

      switch (e.key) {
        case "ArrowUp":
          newRow = Math.max(0, row - 1)
          break
        case "ArrowDown":
          newRow = Math.min(numRows - 1, row + 1)
          break
        case "ArrowLeft":
          newCol = Math.max(0, col - 1)
          break
        case "ArrowRight":
          newCol = Math.min(numCols - 1, col + 1)
          break
      }

      gridRefs.current[newRow][newCol]?.focus()
    } else if (e.key === "Enter") {
      startEditing(row, col)
    } else if (
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      !grid[row][col].readOnly
    ) {
      // If user starts typing, activate the cell and set the initial value
      e.preventDefault() // Prevent the keypress from being handled twice
      startEditing(row, col, e.key)
    }
  }

  // Local input change handler - only updates editing value
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditingValue(e.target.value)
  }

  const handleOnSelectExercise = (
    exercise: Exercise,
    row: number,
    col: number
  ) => {
    // Get the current exercise data for comparison
    const cell = grid[row][col]
    if (!cell.originalBlockIndex) {
      log.error("No original block index found", { cell })
      return
    }
    const currentBlock = workout.blocks[cell.originalBlockIndex]
    const oldExercise =
      currentBlock?.type === "exercise"
        ? { id: currentBlock.exercise.id, name: currentBlock.exercise.name }
        : { id: "", name: "" }

    const change: ExerciseSelection = {
      type: "exercise-selection",
      cell,
      exercise: {
        id: exercise.id,
        name: exercise.name,
      },
      oldExercise,
    }

    handleGridChange(change)
    gridRefs.current[activeCell!.row][activeCell!.col]?.focus()
    setActiveCell(null)
  }

  const handleAddRow = (
    rowIndex: number,
    colIndex: number,
    type: "exercise" | "circuit" | "exercise-in-circuit"
  ) => {
    if (type === "exercise-in-circuit") {
      // Handle adding exercise within a circuit
      const currentCell = grid[rowIndex]?.[0]
      if (!currentCell || currentCell.originalBlockIndex === undefined) return

      const newBlocks = [...workout.blocks]
      const circuitBlockIndex = currentCell.originalBlockIndex
      const circuitBlock = newBlocks[circuitBlockIndex]

      if (!circuitBlock || circuitBlock.type !== "circuit") return

      // Create new exercise to add to circuit
      const newExercise: ExerciseBlock = {
        type: "exercise",
        exercise: {
          id: uuidv4(),
          name: "",
          metadata: {
            sets: circuitBlock.circuit.metadata.sets,
            reps: "",
            weight: "",
            rest: circuitBlock.circuit.metadata.rest,
            notes: "",
          },
        },
      }

      // Get the exercise index from the current cell
      const exerciseIndexInCircuit = currentCell.exerciseIndexInCircuit

      // Create updated circuit block
      const updatedCircuitBlock = { ...circuitBlock }
      updatedCircuitBlock.circuit = { ...updatedCircuitBlock.circuit }
      const updatedExercises = [...updatedCircuitBlock.circuit.exercises]

      // Insert the new exercise after the current exercise in the circuit
      const insertIndex =
        exerciseIndexInCircuit !== undefined && exerciseIndexInCircuit >= 0
          ? exerciseIndexInCircuit + 1
          : updatedExercises.length
      updatedExercises.splice(insertIndex, 0, newExercise)

      updatedCircuitBlock.circuit.exercises = updatedExercises
      newBlocks[circuitBlockIndex] = updatedCircuitBlock

      const updatedWorkout = { ...workout, blocks: newBlocks }
      onWorkoutChange(updatedWorkout)
      setActiveCell({ row: rowIndex + 1, col: colIndex })
    } else if (type === "exercise") {
      // Handle adding regular exercise or circuit block
      const newBlocks = [...workout.blocks]
      const newBlock: ExerciseBlock = {
        type: "exercise",
        exercise: {
          id: uuidv4(),
          name: "",
          metadata: {
            sets: "",
            reps: "",
            weight: "",
            rest: "",
            notes: "",
          },
        },
      }

      // Convert grid row index to workout block index
      const currentCell = grid[rowIndex]?.[0]
      if (currentCell && currentCell.originalBlockIndex !== undefined) {
        const blockInsertIndex = currentCell.originalBlockIndex + 1
        newBlocks.splice(blockInsertIndex, 0, newBlock)
      } else {
        // Fallback: add to end if we can't determine position
        // TODO: LOG ERROR here
        newBlocks.push(newBlock)
      }

      const updatedWorkout = { ...workout, blocks: newBlocks }
      onWorkoutChange(updatedWorkout)
      setActiveCell({ row: rowIndex + 1, col: colIndex })
    } else if (type === "circuit") {
      // Handle adding circuit block
      const newBlocks = [...workout.blocks]
      const newBlock: CircuitBlock = {
        type: "circuit",
        circuit: {
          isDefault: false,
          description: "",
          name: "",
          metadata: {
            sets: "",
            rest: "",
            notes: "",
          },
          exercises: [
            {
              type: "exercise",
              exercise: {
                id: uuidv4(),
                name: "",
                metadata: {
                  sets: "",
                  reps: "",
                  weight: "",
                  rest: "",
                  notes: "",
                },
              },
            },
          ],
        },
      }

      // Convert grid row index to workout block index
      const currentCell = grid[rowIndex]?.[0]
      if (currentCell && currentCell.originalBlockIndex !== undefined) {
        const blockInsertIndex = currentCell.originalBlockIndex + 1
        newBlocks.splice(blockInsertIndex, 0, newBlock)
      } else {
        // Fallback: add to end if we can't determine position
        newBlocks.push(newBlock)
      }

      const updatedWorkout = { ...workout, blocks: newBlocks }
      onWorkoutChange(updatedWorkout)
      setActiveCell({ row: rowIndex + 1, col: colIndex })
    }
  }

  // TODO: handle proposal action
  const handleProposalAction = (
    rowIndex: number,
    action: "accept" | "reject"
  ) => {
    const cell = grid[rowIndex]?.[0]
    if (!(cell?.isProposed && cell.pendingStatus?.proposalId)) {
      return
    }

    const proposalId = cell.pendingStatus.proposalId

    // Call the parent's proposal action handler if provided
    if (onProposalAction) {
      onProposalAction(proposalId, action)
    }
  }

  return (
    <>
      {grid.map((row: Cell[], rowIndex: number) => {
        return (
          <GridContentRow
            activeCell={activeCell}
            currentChangeId={currentChangeId}
            editingValue={editingValue}
            grid={grid}
            gridRefs={gridRefs}
            handleAddRow={handleAddRow}
            handleInputChange={handleInputChange}
            handleKeyDown={handleKeyDown}
            handleOnSelectExercise={handleOnSelectExercise}
            handleProposalAction={handleProposalAction}
            key={`row-${rowIndex}`}
            numCols={numCols}
            numRows={numRows}
            openDropdownRow={openDropdownRow}
            row={row}
            rowIndex={rowIndex}
            setActiveCell={setActiveCell}
            setOpenDropdownRow={setOpenDropdownRow}
            startEditing={startEditing}
            stopEditing={stopEditing}
            workout={workout}
          />
        )
      })}
    </>
  )
}

type GridRowProps = {
  row: Cell[]
  numRows: number
  numCols: number
  activeCell: Position | null
  rowIndex: number
  openDropdownRow: number | null
  handleAddRow: (
    rowIndex: number,
    colIndex: number,
    type: "exercise" | "circuit" | "exercise-in-circuit"
  ) => void
  handleOnSelectExercise: (exercise: Exercise, row: number, col: number) => void
  handleInputChange: (
    e: ChangeEvent<HTMLInputElement>,
    row: number,
    col: number
  ) => void
  handleProposalAction: (rowIndex: number, action: "accept" | "reject") => void
  handleKeyDown: (e: KeyboardEvent, row: number, col: number) => void
  setActiveCell: (cell: Position | null) => void
  setOpenDropdownRow: (row: number | null) => void
  gridRefs: React.RefObject<HTMLDivElement[][]>
  editingValue: string
  stopEditing: (row: number, col: number) => void
  startEditing: (row: number, col: number, initialValue?: string) => void
  grid: Cell[][]
  workout: Workout
  currentChangeId: string | null
}

type RowActionBarProps = {
  row: Cell[]
  rowIndex: number
  openDropdownRow: number | null
  handleProposalAction: (rowIndex: number, action: "accept" | "reject") => void
  handleAddRow: (
    rowIndex: number,
    colIndex: number,
    type: "exercise" | "circuit" | "exercise-in-circuit"
  ) => void
  handleOnSelectExercise: (exercise: Exercise, row: number, col: number) => void
  setOpenDropdownRow: (row: number | null) => void
}

/*
 RowActionBar is the action bar that appears next to each row.
 */
function RowActionBar({
  row,
  rowIndex,
  openDropdownRow,
  handleProposalAction,
  setOpenDropdownRow,
  handleAddRow,
}: RowActionBarProps) {
  // Helper function to get color class based on proposed change type
  const getProposedChangeColorClass = (changeType?: string) => {
    if (changeType === "adding") {
      return "text-green-400 hover:text-green-300"
    }
    if (changeType === "removing") {
      return "text-red-400 hover:text-red-300"
    }
    return "text-blue-400 hover:text-blue-300"
  }

  // Helper function to determine if we should show accept/reject buttons
  const shouldShowProposalButtons = () => {
    const firstCell = row[0]
    if (!firstCell?.isProposed) return false

    return (
      firstCell.isCircuitHeader ||
      !(firstCell.isCircuitExercise || firstCell.isCircuitHeader) ||
      (firstCell.isCircuitExercise && firstCell.isIndividualChange)
    )
  }

  // Helper function to render the content based on state
  const renderActionButtons = () => {
    const firstCell = row[0]

    if (shouldShowProposalButtons()) {
      // Proposed change action buttons
      return (
        <>
          <Button
            className={`h-6 w-6 cursor-pointer transition-opacity ease-in-out focus:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 ${getProposedChangeColorClass(firstCell?.proposedChangeType)}`}
            onClick={() => {
              handleProposalAction(rowIndex, "accept")
            }}
            size="icon"
            title={`Accept proposed ${firstCell?.proposedChangeType?.replace("-", " ")}`}
            variant="ghost"
          >
            <Icons.check className="h-4 w-4" />
          </Button>
          <Button
            className="h-6 w-6 cursor-pointer text-red-400 transition-opacity ease-in-out hover:text-red-300 focus:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100"
            onClick={() => {
              handleProposalAction(rowIndex, "reject")
            }}
            size="icon"
            title={`Reject proposed ${firstCell?.proposedChangeType?.replace("-", " ")}`}
            variant="ghost"
          >
            <Icons.x className="h-4 w-4" />
          </Button>
        </>
      )
    }

    return (
      <>
        <div className="h-6 w-6" />
        <AddRowDropdown
          isInCircuit={
            firstCell?.isCircuitHeader || firstCell?.isCircuitExercise
          }
          onAddRow={(type) => handleAddRow(rowIndex, 0, type)}
          onOpenChange={(open) => setOpenDropdownRow(open ? rowIndex : null)}
        />
      </>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center px-2",
        openDropdownRow === rowIndex ? "opacity-100" : ""
      )}
      id="action menu"
    >
      {renderActionButtons()}
    </div>
  )
}

function GridContentRow({
  row,
  numRows,
  numCols,
  activeCell,
  rowIndex,
  openDropdownRow,
  handleAddRow,
  handleOnSelectExercise,
  handleInputChange,
  handleProposalAction,
  handleKeyDown,
  setActiveCell,
  setOpenDropdownRow,
  gridRefs,
  editingValue,
  stopEditing,
  startEditing,
  currentChangeId,
}: GridRowProps) {
  return (
    <div className="group flex h-9 w-full" key={`row-${rowIndex}`}>
      <RowActionBar
        handleAddRow={handleAddRow}
        handleOnSelectExercise={handleOnSelectExercise}
        handleProposalAction={handleProposalAction}
        openDropdownRow={openDropdownRow}
        row={row}
        rowIndex={rowIndex}
        setOpenDropdownRow={setOpenDropdownRow}
      />
      {row.map((cell, colIndex) => (
        <div
          className={getCellClasses(
            cell,
            cn(
              "relative shrink-0 flex-grow overflow-hidden truncate border-neutral-800 border-r border-b p-2 focus-within:outline-none focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-inset",
              rowIndex === 0 && "border-t",
              colIndex === 0 && "border-l",
              rowIndex === numRows - 1 && colIndex === 0 && "rounded-bl-sm",
              rowIndex === numRows - 1 &&
                colIndex === numCols - 1 &&
                "rounded-br-sm",
              cell.readOnly && "cursor-not-allowed text-neutral-500"
            ),
            currentChangeId
          )}
          key={`${rowIndex}-${colIndex}`}
          onClick={() => gridRefs.current[rowIndex][colIndex]?.focus()}
          onDoubleClick={() => startEditing(rowIndex, colIndex, cell.value)}
          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
          ref={(el) => {
            if (el) {
              gridRefs.current[rowIndex] = gridRefs.current[rowIndex] || []
              gridRefs.current[rowIndex][colIndex] = el
            }
          }}
          style={{
            flexBasis: cell.width,
          }}
          tabIndex={0}
        >
          {activeCell?.row === rowIndex &&
          activeCell?.col === colIndex &&
          !cell.readOnly ? (
            colIndex === 0 && !cell.isCircuitHeader ? (
              <ExerciseInput
                onBlur={() => {
                  setActiveCell(null)
                  gridRefs.current[rowIndex][colIndex]?.focus()
                }}
                onSelectExercise={(exercise) => {
                  handleOnSelectExercise(exercise, rowIndex, colIndex)
                }}
                value={cell.value || ""}
              />
            ) : (
              <input
                autoFocus
                className="m-0 h-full w-full truncate py-2 text-sm focus-within:outline-none focus:outline-none"
                onBlur={() => {
                  stopEditing(rowIndex, colIndex)
                  gridRefs.current[rowIndex][colIndex]?.focus()
                }}
                onChange={(e) => handleInputChange(e, rowIndex, colIndex)}
                value={editingValue}
              />
            )
          ) : (
            cell?.value
          )}
        </div>
      ))}
    </div>
  )
}

// Enhanced workout-to-grid mapping function that includes proposed changes
function createGridFromWorkoutWithChanges(
  workout: Workout,
  columns: Column[]
): Cell[][] {
  const grid: Cell[][] = []
  let currentRowIndex = 0

  // Process each block and check for pending status
  workout.blocks.forEach((block, blockIndex) => {
    // Get the pending status for this block
    const blockPendingStatus = block.pendingStatus
    const isBlockProposed = blockPendingStatus !== undefined
    const blockChangeIndex = isBlockProposed ? 0 : undefined

    if (block.type === "exercise") {
      // Regular exercise row
      const exerciseRow = columns.map((col, colIndex) => ({
        type:
          col.field === "exercise_name"
            ? ("select" as const)
            : ("input" as const),
        value: getValueFromBlock(block, col.field),
        colType: col.field,
        width: col.width || 100,
        rowIndex: currentRowIndex,
        colIndex,
        blockType: "exercise" as const,
        originalBlockIndex: blockIndex,
        isCircuitExercise: false,
        // Set proposed change properties based on pendingStatus
        isProposed: isBlockProposed,
        proposedChangeIndex: blockChangeIndex,
        proposedChangeType: blockPendingStatus?.type,
        // Add the pending status reference for proposal ID access
        pendingStatus: blockPendingStatus,
      }))
      grid.push(exerciseRow)
      currentRowIndex++
    } else if (block.type === "circuit") {
      // Circuit header row (dummy row)
      const circuitHeaderRow = columns.map((col, colIndex) => ({
        type: "input" as const,
        value: getValueFromCircuitBlock(block, col.field),
        colType: col.field,
        width: col.width || 100,
        rowIndex: currentRowIndex,
        colIndex,
        isCircuitHeader: true,
        blockType: "circuit" as const,
        originalBlockIndex: blockIndex,
        readOnly: col.field === "reps" || col.field === "weight",
        isCircuitExercise: false,
        // Set proposed change properties based on pendingStatus
        isProposed: isBlockProposed,
        proposedChangeIndex: blockChangeIndex,
        proposedChangeType: blockPendingStatus?.type,
        // Add the pending status reference for proposal ID access
        pendingStatus: blockPendingStatus,
      }))
      grid.push(circuitHeaderRow)
      currentRowIndex++

      // Circuit exercises
      block.circuit.exercises.forEach((exerciseBlock, exerciseIndex) => {
        // Get the pending status for this exercise
        const exercisePendingStatus = exerciseBlock.pendingStatus
        const isExerciseProposed = exercisePendingStatus !== undefined
        const exerciseChangeIndex = isExerciseProposed ? 0 : undefined

        const exerciseRow = columns.map((col, colIndex) => ({
          type:
            col.field === "exercise_name"
              ? ("select" as const)
              : ("input" as const),
          value: getValueFromBlock(exerciseBlock, col.field),
          colType: col.field,
          width: col.width || 100,
          rowIndex: currentRowIndex,
          colIndex,
          readOnly: col.field === "sets" || col.field === "rest",
          blockType: "exercise" as const,
          originalBlockIndex: blockIndex,
          isCircuitExercise: true,
          exerciseIndexInCircuit: exerciseIndex, // Store the index
          // Exercise can be proposed individually or as part of a circuit block
          isProposed: isBlockProposed || isExerciseProposed,
          proposedChangeIndex: isExerciseProposed
            ? exerciseChangeIndex
            : isBlockProposed
              ? blockChangeIndex
              : undefined,
          proposedChangeType: isExerciseProposed
            ? exercisePendingStatus?.type
            : isBlockProposed
              ? blockPendingStatus?.type
              : undefined,
          // Flag to track if this is an individual exercise change (not part of circuit change)
          isIndividualChange: isExerciseProposed,
          // Add the pending status reference for proposal ID access
          pendingStatus: isExerciseProposed
            ? exercisePendingStatus
            : isBlockProposed
              ? blockPendingStatus
              : undefined,
        }))
        grid.push(exerciseRow)
        currentRowIndex++
      })
    }
  })

  return grid
}

// Extract value from exercise block based on field
function getValueFromBlock(block: ExerciseBlock, field: string): string {
  switch (field) {
    case "exercise_name":
      return block.exercise.name
    case "sets":
      return block.exercise.metadata.sets
    case "reps":
      return block.exercise.metadata.reps
    case "weight":
      return block.exercise.metadata.weight
    case "rest":
      return block.exercise.metadata.rest
    case "notes":
      return block.exercise.metadata.notes || ""
    default:
      return ""
  }
}

// Extract value from circuit block based on field (for circuit header row)
function getValueFromCircuitBlock(block: CircuitBlock, field: string): string {
  switch (field) {
    case "exercise_name":
      return block.circuit.name
    case "sets":
      return block.circuit.metadata.sets
    case "reps":
      return "" // Circuits don't have reps, only exercises within circuits do
    case "weight":
      return "" // Circuits don't have weight, only exercises within circuits do
    case "rest":
      return block.circuit.metadata.rest
    case "notes":
      return block.circuit.metadata.notes || ""
    default:
      return ""
  }
}

// Incremental update function
function applyIncrementalChange(change: GridChange, workout: Workout): Workout {
  const cell = change.cell

  if (!cell) return workout

  const newBlocks = [...workout.blocks]
  const originalBlockIndex = cell.originalBlockIndex!
  const blockToUpdate = newBlocks[originalBlockIndex]

  if (!blockToUpdate) return workout

  if (blockToUpdate.type === "exercise") {
    // Direct exercise block update
    const updatedBlock = { ...blockToUpdate }

    if (isExerciseSelection(change)) {
      updatedBlock.exercise = {
        ...updatedBlock.exercise,
        id: change.exercise.id,
        name: change.exercise.name,
      }
    } else if (isCellChange(change)) {
      if (cell.colType === "exercise_name") {
        updatedBlock.exercise = {
          ...updatedBlock.exercise,
          name: change.newValue,
        }
      } else {
        updatedBlock.exercise = {
          ...updatedBlock.exercise,
          metadata: {
            ...updatedBlock.exercise.metadata,
            [cell.colType]: change.newValue,
          },
        }
      }
    }

    newBlocks[originalBlockIndex] = updatedBlock
  } else if (blockToUpdate.type === "circuit") {
    const updatedBlock = { ...blockToUpdate }
    updatedBlock.circuit = { ...updatedBlock.circuit }

    if (cell.isCircuitHeader) {
      // Update circuit metadata
      if (isCellChange(change)) {
        if (cell.colType === "exercise_name") {
          updatedBlock.circuit.name = change.newValue
        } else if (["rest", "notes"].includes(cell.colType)) {
          updatedBlock.circuit.metadata = {
            ...updatedBlock.circuit.metadata,
            [cell.colType]: change.newValue,
          }
        } else if (cell.colType === "sets") {
          updatedBlock.circuit.metadata.sets = change.newValue
          updatedBlock.circuit.exercises.forEach((exercise) => {
            exercise.exercise.metadata.sets = change.newValue
          })
        }
      }
    } else {
      // Update exercise within circuit
      // Use the stored exercise index
      const exerciseIndexInCircuit = cell.exerciseIndexInCircuit

      if (exerciseIndexInCircuit !== undefined && exerciseIndexInCircuit >= 0) {
        const updatedExercises = [...updatedBlock.circuit.exercises]
        const exerciseToUpdate = { ...updatedExercises[exerciseIndexInCircuit] }

        if (isExerciseSelection(change)) {
          exerciseToUpdate.exercise = {
            ...exerciseToUpdate.exercise,
            id: change.exercise.id,
            name: change.exercise.name,
          }
        } else if (isCellChange(change)) {
          if (cell.colType === "exercise_name") {
            exerciseToUpdate.exercise = {
              ...exerciseToUpdate.exercise,
              name: change.newValue,
            }
          } else {
            exerciseToUpdate.exercise = {
              ...exerciseToUpdate.exercise,
              metadata: {
                ...exerciseToUpdate.exercise.metadata,
                [cell.colType]: change.newValue,
              },
            }
          }
        }

        updatedExercises[exerciseIndexInCircuit] = exerciseToUpdate
        updatedBlock.circuit.exercises = updatedExercises
      }
    }

    newBlocks[originalBlockIndex] = updatedBlock
  }

  return {
    ...workout,
    blocks: newBlocks,
  }
}

// Helper function removed - exercise index is now stored in cell.exerciseIndexInCircuit
