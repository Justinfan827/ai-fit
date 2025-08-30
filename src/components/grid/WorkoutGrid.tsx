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
} from "@/hooks/zustand/program-editor-state"
import type {
  CircuitBlock,
  Exercise,
  ExerciseBlock,
  Workout,
} from "@/lib/domain/workouts"
import log from "@/lib/logger/logger"
import { cn } from "@/lib/utils"
import type { Column } from "./columns"
import type {
  Cell,
  CellChange,
  ExerciseSelection,
  GridChange,
  Position,
  RowDeletion,
} from "./workout-grid-types"
import {
  applyIncrementalChange,
  createGridFromWorkoutWithChanges,
  getCellClasses,
} from "./workout-grid-utils"

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
      <WorkoutGridHeaderRow columns={columns} />
      <WorkoutGridRows
        columns={columns}
        onProposalAction={onProposalAction}
        onWorkoutChange={handleWorkoutChange}
        workout={workout}
      />
      <DebugWorkoutJSON workout={workout} />
    </div>
  )
}

function DebugWorkoutJSON({ workout }: { workout: Workout }) {
  const [showDebug, setShowDebug] = useState(false)
  return (
    <>
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
    </>
  )
}

function WorkoutGridHeaderRow({ columns }: { columns: Column[] }) {
  return (
    <div className="flex w-full pl-[var(--action-menu-padding)]" id="headers">
      <div className="flex" id="dummy-action-menu" />
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

/*

WorkoutGridRows is the main component that renders the grid rows. It is responsible for:
- Rendering the grid rows
- Handling the active cell
- Handling the editing value
- Handling the original value
- Handling the grid refs

This component holds a ton of client side state. 
*/
function WorkoutGridRows({
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
  const grid = createGridFromWorkoutWithChanges(workout, columns)
  const numRows = grid.length
  const numCols = columns.length
  const [activeCell, setActiveCell] = useState<Position | null>(null)
  const [openDropdownRow, setOpenDropdownRow] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState<string>("")
  const [originalValue, setOriginalValue] = useState<string>("")
  const gridRefs = useRef<HTMLButtonElement[][]>([])
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
        default:
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
    if (!activeCell) {
      log.error("No active cell found", { row, col })
      return
    }
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
    gridRefs.current[activeCell.row][activeCell.col]?.focus()
    setActiveCell(null)
  }

  // handle adding an exercise within a circuit
  const handleAddExerciseInCircuit = (rowIndex: number, colIndex: number) => {
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
  }

  // Handle adding a regular exercise block
  const handleAddExercise = (rowIndex: number, colIndex: number) => {
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
  }

  // Handle adding a circuit block
  const handleAddCircuit = (rowIndex: number, colIndex: number) => {
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
  const handleDeleteRow = (rowIndex: number) => {
    const currentCell = grid[rowIndex]?.[0]
    if (!currentCell || currentCell.originalBlockIndex === undefined) {
      log.error("Cannot delete row: invalid cell or missing block index", {
        rowIndex,
        currentCell,
      })
      return
    }

    const blockIndex = currentCell.originalBlockIndex

    // Determine what type of deletion this is
    if (
      currentCell.isCircuitExercise &&
      currentCell.exerciseIndexInCircuit !== undefined
    ) {
      // Deleting an exercise within a circuit
      const change: RowDeletion = {
        type: "row-deletion",
        cell: currentCell,
        blockIndex,
        exerciseIndexInCircuit: currentCell.exerciseIndexInCircuit,
      }
      handleGridChange(change)
    } else {
      // Deleting an entire block (either standalone exercise or entire circuit)
      const change: RowDeletion = {
        type: "row-deletion",
        cell: currentCell,
        blockIndex,
      }
      handleGridChange(change)
    }
  }

  const handleAddRow = (
    rowIndex: number,
    colIndex: number,
    type: "exercise" | "circuit" | "exercise-in-circuit"
  ) => {
    if (type === "exercise-in-circuit") {
      handleAddExerciseInCircuit(rowIndex, colIndex)
    } else if (type === "exercise") {
      handleAddExercise(rowIndex, colIndex)
    } else if (type === "circuit") {
      handleAddCircuit(rowIndex, colIndex)
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
          <WorkoutGridRow
            activeCell={activeCell}
            editingValue={editingValue}
            grid={grid}
            gridRefs={gridRefs}
            handleAddRow={handleAddRow}
            handleDeleteRow={handleDeleteRow}
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
  handleDeleteRow: (rowIndex: number) => void
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
  gridRefs: React.RefObject<HTMLButtonElement[][]>
  editingValue: string
  stopEditing: (row: number, col: number) => void
  startEditing: (row: number, col: number, initialValue?: string) => void
  grid: Cell[][]
  workout: Workout
}

type RowActionBarProps = {
  row: Cell[]
  rowIndex: number
  openDropdownRow: number | null
  handleProposalAction: (rowIndex: number, action: "accept" | "reject") => void
  handleDeleteRow: (rowIndex: number) => void
  handleAddRow: (
    rowIndex: number,
    colIndex: number,
    type: "exercise" | "circuit" | "exercise-in-circuit"
  ) => void
  handleOnSelectExercise: (exercise: Exercise, row: number, col: number) => void
  setOpenDropdownRow: (row: number | null) => void
}

function DeleteRowButton({ onDeleteRow }: { onDeleteRow: () => void }) {
  return (
    <Button
      className="h-6 w-6 cursor-pointer text-red-400 opacity-0 transition-opacity ease-in-out hover:text-red-300 focus:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100"
      onClick={onDeleteRow}
      size="icon"
      variant="ghost"
    >
      <Icons.x className="h-4 w-4" />
    </Button>
  )
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
  handleDeleteRow,
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
        <DeleteRowButton onDeleteRow={() => handleDeleteRow(rowIndex)} />
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
        "flex items-center gap-2 px-2",
        openDropdownRow === rowIndex ? "opacity-100" : ""
      )}
      id="action menu"
    >
      {renderActionButtons()}
    </div>
  )
}

/*

WorkoutGridRow is the main component that renders a row in the workout grid.

*/
function WorkoutGridRow({
  row,
  numRows,
  numCols,
  activeCell,
  rowIndex,
  openDropdownRow,
  handleAddRow,
  handleDeleteRow,
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
}: GridRowProps) {
  const currentChangeId = useZCurrentChangeId()

  return (
    <div className="group flex h-9 w-full" key={`row-${rowIndex}`}>
      <RowActionBar
        handleAddRow={handleAddRow}
        handleDeleteRow={handleDeleteRow}
        handleOnSelectExercise={handleOnSelectExercise}
        handleProposalAction={handleProposalAction}
        openDropdownRow={openDropdownRow}
        row={row}
        rowIndex={rowIndex}
        setOpenDropdownRow={setOpenDropdownRow}
      />
      {row.map((cell, colIndex) => (
        <button
          className={getCellClasses(
            cell,
            cn(
              "relative shrink-0 flex-grow overflow-hidden truncate border-neutral-800 border-r border-b p-2 text-left focus-within:outline-none focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-inset",
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
          type="button"
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
        </button>
      ))}
    </div>
  )
}
