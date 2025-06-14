import { ChangeEvent, KeyboardEvent, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { DebugToggle } from '@/components/debug-toggle'
import AddRowDropdown from '@/components/grid/AddRowDropdown'
import ExerciseInput from '@/components/grid/ExerciseInput'
import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  CircuitBlock,
  Exercise,
  ExerciseBlock,
  Workout,
} from '@/lib/domain/workouts'
import { cn } from '@/lib/utils'
import { Column } from './columns'

// Utility function for getting row-specific styling
function getRowStyles(cell: Cell) {
  return {
    // Circuit header styles
    circuitHeader: cell.isCircuitHeader,
    // Circuit exercise styles
    circuitExercise: cell.isCircuitExercise,
    // Standalone exercise styles
    standaloneExercise: !cell.isCircuitHeader && !cell.isCircuitExercise,
  }
}

// Utility function for getting cell CSS classes
function getCellClasses(cell: Cell, baseClasses: string) {
  const styles = getRowStyles(cell)

  return cn(
    baseClasses,
    // Circuit header styling
    styles.circuitHeader && 'bg-neutral-900 font-medium text-orange-400',
    // Circuit exercise styling - subtle background with left border accent
    styles.circuitExercise &&
      'bg-neutral-925 border-l-2 border-l-orange-400/50',
    // Standalone exercise styling (default)
    styles.standaloneExercise && 'bg-neutral-950'
  )
}

interface Position {
  row: number
  col: number
}

interface CellChange {
  type: 'cell'
  cell: Cell
  oldValue: string
  newValue: string
}

interface ExerciseSelection {
  type: 'exercise-selection'
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
  return 'type' in change && change.type === 'exercise-selection'
}

function isCellChange(change: GridChange): change is CellChange {
  return 'type' in change && change.type === 'cell'
}

interface Cell {
  type: 'input' | 'select' | 'display'
  value: string
  colType: string
  width: number
  rowIndex: number
  colIndex: number
  isCircuitHeader?: boolean
  blockType?: 'exercise' | 'circuit'
  originalBlockIndex?: number
  readOnly?: boolean
  isCircuitExercise?: boolean
}

export default function WorkoutGrid({
  workout,
  onWorkoutChange,
  columns,
}: {
  workout: Workout
  onWorkoutChange: (workout: Workout) => void
  columns: Column[]
}) {
  const [showDebug, setShowDebug] = useState(false)

  return (
    <div className="text-sm">
      <GridHeaderRow columns={columns} />
      <GridContentRows
        workout={workout}
        onWorkoutChange={onWorkoutChange}
        columns={columns}
      />
      {showDebug && (
        <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
          <h3 className="mb-2 text-sm font-medium text-neutral-400">
            Debug: Current Workout
          </h3>
          <pre className="overflow-auto text-xs text-neutral-300">
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
    <div id="headers" className="flex w-full">
      <div id="dummy-action-menu" className="ml-[48px] flex px-2" />
      {columns.map((col, idx) => {
        return (
          <div
            className={cn(
              'shrink-0 grow border-t border-r border-neutral-800 bg-neutral-950 p-2 text-sm font-light tracking-wider text-neutral-400 uppercase',
              idx === 0 && 'rounded-tl-sm border-l',
              idx === columns.length - 1 && 'rounded-tr-sm'
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
}: {
  columns: Column[]
  workout: Workout
  onWorkoutChange: (workout: Workout) => void
}) {
  // Create grid directly from workout
  const grid = createGridFromWorkout(workout, columns)
  const numRows = grid.length
  const numCols = columns.length
  const [activeCell, setActiveCell] = useState<Position | null>(null)
  const [openDropdownRow, setOpenDropdownRow] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const [originalValue, setOriginalValue] = useState<string>('')
  const gridRefs = useRef<HTMLDivElement[][]>([])

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
        type: 'cell',
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
    const currentValue = cell.value || ''
    setActiveCell({ row, col })
    setOriginalValue(currentValue)
    setEditingValue(initialValue !== undefined ? initialValue : currentValue)
  }

  // Stop editing and save changes
  const stopEditing = (row: number, col: number) => {
    saveChanges(row, col)
    setActiveCell(null)
    setEditingValue('')
    setOriginalValue('')
  }

  const handleKeyDown = (e: KeyboardEvent, row: number, col: number) => {
    if (activeCell) {
      if (e.key === 'Tab' && e.shiftKey) {
        // idk if we need this
        //e.preventDefault()
        //const newCol = Math.max(0, col - 1)
        //setActiveCell(null)
        //gridRefs.current[row][newCol]?.focus()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        stopEditing(row, col)
        const nextRow = Math.min(numRows - 1, row + 1)
        gridRefs.current[nextRow][col]?.focus()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setActiveCell(null)
        setEditingValue('')
        setOriginalValue('')
        gridRefs.current[row][col]?.focus()
      }
      return
    }

    // Handle navigation when no cell is active
    const isArrowKey = [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
    ].includes(e.key)

    if (isArrowKey) {
      e.preventDefault()
      let newRow = row
      let newCol = col

      switch (e.key) {
        case 'ArrowUp':
          newRow = Math.max(0, row - 1)
          break
        case 'ArrowDown':
          newRow = Math.min(numRows - 1, row + 1)
          break
        case 'ArrowLeft':
          newCol = Math.max(0, col - 1)
          break
        case 'ArrowRight':
          newCol = Math.min(numCols - 1, col + 1)
          break
      }

      gridRefs.current[newRow][newCol]?.focus()
    } else if (e.key === 'Enter') {
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
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    row: number,
    col: number
  ) => {
    setEditingValue(e.target.value)
  }

  const handleOnSelectExercise = (
    exercise: Exercise,
    row: number,
    col: number
  ) => {
    // Get the current exercise data for comparison
    const cell = grid[row][col]
    const currentBlock = workout.blocks[cell.originalBlockIndex!]
    const oldExercise =
      currentBlock?.type === 'exercise'
        ? { id: currentBlock.exercise.id, name: currentBlock.exercise.name }
        : { id: '', name: '' }

    const change: ExerciseSelection = {
      type: 'exercise-selection',
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
    type: 'exercise' | 'circuit'
  ) => {
    const newBlocks = [...workout.blocks]
    const newBlock: ExerciseBlock = {
      type: 'exercise',
      exercise: {
        id: uuidv4(),
        name: '',
        metadata: {
          sets: '',
          reps: '',
          weight: '',
          rest: '',
          notes: '',
        },
      },
    }

    newBlocks.splice(rowIndex + 1, 0, newBlock)
    const updatedWorkout = { ...workout, blocks: newBlocks }
    onWorkoutChange(updatedWorkout)
    setActiveCell({ row: rowIndex + 1, col: colIndex })
  }

  return (
    <>
      {grid.map((row, rowIndex) => {
        return (
          <GridContentRow
            key={`row-${rowIndex}`}
            gridRefs={gridRefs}
            row={row}
            numRows={numRows}
            numCols={numCols}
            activeCell={activeCell}
            rowIndex={rowIndex}
            setOpenDropdownRow={setOpenDropdownRow}
            openDropdownRow={openDropdownRow}
            handleAddRow={handleAddRow}
            handleOnSelectExercise={handleOnSelectExercise}
            handleInputChange={handleInputChange}
            handleKeyDown={handleKeyDown}
            setActiveCell={setActiveCell}
            editingValue={editingValue}
            stopEditing={stopEditing}
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
    type: 'exercise' | 'circuit'
  ) => void
  handleOnSelectExercise: (exercise: Exercise, row: number, col: number) => void
  handleInputChange: (
    e: ChangeEvent<HTMLInputElement>,
    row: number,
    col: number
  ) => void
  handleKeyDown: (e: KeyboardEvent, row: number, col: number) => void
  setActiveCell: (cell: Position | null) => void
  setOpenDropdownRow: (row: number | null) => void
  gridRefs: React.RefObject<HTMLDivElement[][]>
  editingValue: string
  stopEditing: (row: number, col: number) => void
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
  handleKeyDown,
  setActiveCell,
  setOpenDropdownRow,
  gridRefs,
  editingValue,
  stopEditing,
}: GridRowProps) {
  return (
    <div key={`row-${rowIndex}`} className="group flex h-9 w-full">
      <div
        id="action menu"
        className={`flex items-center px-2 ${
          openDropdownRow === rowIndex ? 'opacity-100' : ''
        }`}
      >
        <div className="">
          <AddRowDropdown
            onAddRow={(type) => handleAddRow(rowIndex, 0, type)}
            onOpenChange={(open) => setOpenDropdownRow(open ? rowIndex : null)}
          />
        </div>
        <div className="">
          <Button
            size="icon"
            variant="ghost"
            className={`text-accent-foreground h-6 w-6 transition-opacity ease-in-out group-focus-within:opacity-100 group-hover:opacity-100 focus:opacity-100 ${
              openDropdownRow === rowIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Icons.gripVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {row.map((cell, colIndex) => (
        <div
          key={`${rowIndex}-${colIndex}`}
          ref={(el) => {
            if (el) {
              gridRefs.current[rowIndex] = gridRefs.current[rowIndex] || []
              gridRefs.current[rowIndex][colIndex] = el
            }
          }}
          tabIndex={0}
          className={getCellClasses(
            cell,
            cn(
              `relative shrink-0 flex-grow cursor-pointer truncate overflow-hidden border-r border-b border-neutral-800 p-2 focus-within:ring-2 focus-within:ring-orange-500 focus-within:outline-none focus-within:ring-inset`,
              rowIndex === 0 && 'border-t',
              colIndex === 0 && 'border-l',
              rowIndex === numRows - 1 && colIndex === 0 && 'rounded-bl-sm',
              rowIndex === numRows - 1 &&
                colIndex === numCols - 1 &&
                'rounded-br-sm'
            )
          )}
          onClick={() => gridRefs.current[rowIndex][colIndex]?.focus()}
          onDoubleClick={() => setActiveCell({ row: rowIndex, col: colIndex })}
          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
          style={{
            flexBasis: cell.width,
          }}
        >
          {activeCell?.row === rowIndex &&
          activeCell?.col === colIndex &&
          !cell.readOnly ? (
            colIndex === 0 && !cell.isCircuitHeader ? (
              <ExerciseInput
                value={cell.value || ''}
                onSelectExercise={(exercise) => {
                  handleOnSelectExercise(exercise, rowIndex, colIndex)
                }}
                onBlur={() => {
                  setActiveCell(null)
                  gridRefs.current[rowIndex][colIndex]?.focus()
                }}
              />
            ) : (
              <input
                className={getCellClasses(
                  cell,
                  'm-0 h-full w-full truncate py-2 text-sm focus-within:outline-none focus:outline-none'
                )}
                value={editingValue}
                onChange={(e) => handleInputChange(e, rowIndex, colIndex)}
                onBlur={() => {
                  stopEditing(rowIndex, colIndex)
                  gridRefs.current[rowIndex][colIndex]?.focus()
                }}
                autoFocus
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

// Direct workout-to-grid mapping function
function createGridFromWorkout(workout: Workout, columns: Column[]): Cell[][] {
  const grid: Cell[][] = []
  let currentRowIndex = 0

  workout.blocks.forEach((block, blockIndex) => {
    if (block.type === 'exercise') {
      // Regular exercise row
      const exerciseRow = columns.map((col, colIndex) => ({
        type:
          col.field === 'exercise_name'
            ? ('select' as const)
            : ('input' as const),
        value: getValueFromBlock(block, col.field),
        colType: col.field,
        width: col.width || 100,
        rowIndex: currentRowIndex,
        colIndex,
        blockType: 'exercise' as const,
        originalBlockIndex: blockIndex,
        isCircuitExercise: false,
      }))
      grid.push(exerciseRow)
      currentRowIndex++
    } else if (block.type === 'circuit') {
      // Circuit header row (dummy row)
      const circuitHeaderRow = columns.map((col, colIndex) => ({
        type: 'input' as const,
        value: getValueFromCircuitBlock(block, col.field),
        colType: col.field,
        width: col.width || 100,
        rowIndex: currentRowIndex,
        colIndex,
        isCircuitHeader: true,
        blockType: 'circuit' as const,
        originalBlockIndex: blockIndex,
        readOnly: col.field === 'reps' || col.field === 'weight',
        isCircuitExercise: false,
      }))
      grid.push(circuitHeaderRow)
      currentRowIndex++

      // Circuit exercises
      block.circuit.exercises.forEach((exerciseBlock) => {
        const exerciseRow = columns.map((col, colIndex) => ({
          type:
            col.field === 'exercise_name'
              ? ('select' as const)
              : ('input' as const),
          value: getValueFromBlock(exerciseBlock, col.field),
          colType: col.field,
          width: col.width || 100,
          rowIndex: currentRowIndex,
          colIndex,
          blockType: 'exercise' as const,
          originalBlockIndex: blockIndex,
          isCircuitExercise: true,
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
    case 'exercise_name':
      return block.exercise.name
    case 'sets':
      return block.exercise.metadata.sets
    case 'reps':
      return block.exercise.metadata.reps
    case 'weight':
      return block.exercise.metadata.weight
    case 'rest':
      return block.exercise.metadata.rest
    case 'notes':
      return block.exercise.metadata.notes || ''
    default:
      return ''
  }
}

// Extract value from circuit block based on field (for circuit header row)
function getValueFromCircuitBlock(block: CircuitBlock, field: string): string {
  switch (field) {
    case 'exercise_name':
      return block.circuit.name
    case 'sets':
      return block.circuit.metadata.sets
    case 'reps':
      return '' // Circuits don't have reps, only exercises within circuits do
    case 'weight':
      return '' // Circuits don't have weight, only exercises within circuits do
    case 'rest':
      return block.circuit.metadata.rest
    case 'notes':
      return block.circuit.metadata.notes || ''
    default:
      return ''
  }
}

// Incremental update function
function applyIncrementalChange(change: GridChange, workout: Workout): Workout {
  // Direct access to cell metadata - no grid rebuild needed!
  const cell = change.cell
  console.log('cell', change)

  if (!cell) return workout

  const newBlocks = [...workout.blocks]
  const originalBlockIndex = cell.originalBlockIndex!
  const blockToUpdate = newBlocks[originalBlockIndex]
  console.log('blockToUpdate', blockToUpdate)

  if (!blockToUpdate) return workout

  if (blockToUpdate.type === 'exercise') {
    // Direct exercise block update
    const updatedBlock = { ...blockToUpdate }

    if (isExerciseSelection(change)) {
      updatedBlock.exercise = {
        ...updatedBlock.exercise,
        id: change.exercise.id,
        name: change.exercise.name,
      }
    } else if (isCellChange(change)) {
      console.log('cell.colType', cell.colType)
      if (cell.colType === 'exercise_name') {
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
  } else if (blockToUpdate.type === 'circuit') {
    const updatedBlock = { ...blockToUpdate }
    updatedBlock.circuit = { ...updatedBlock.circuit }

    if (cell.isCircuitHeader) {
      // Update circuit metadata
      if (isCellChange(change)) {
        if (cell.colType === 'exercise_name') {
          updatedBlock.circuit.name = change.newValue
        } else if (['sets', 'rest', 'notes'].includes(cell.colType)) {
          updatedBlock.circuit.metadata = {
            ...updatedBlock.circuit.metadata,
            [cell.colType]: change.newValue,
          }
        }
      }
    } else {
      // Update exercise within circuit
      // Find which exercise in the circuit this row corresponds to
      const exerciseIndexInCircuit = findExerciseIndexInCircuit(
        workout,
        cell.rowIndex,
        originalBlockIndex
      )

      if (exerciseIndexInCircuit >= 0) {
        const updatedExercises = [...updatedBlock.circuit.exercises]
        const exerciseToUpdate = { ...updatedExercises[exerciseIndexInCircuit] }

        if (isExerciseSelection(change)) {
          exerciseToUpdate.exercise = {
            ...exerciseToUpdate.exercise,
            id: change.exercise.id,
            name: change.exercise.name,
          }
        } else if (isCellChange(change)) {
          if (cell.colType === 'exercise_name') {
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

// Helper function to find which exercise within a circuit corresponds to a grid row
function findExerciseIndexInCircuit(
  workout: Workout,
  gridRow: number,
  circuitBlockIndex: number
): number {
  let currentRow = 0

  for (let blockIndex = 0; blockIndex < workout.blocks.length; blockIndex++) {
    const block = workout.blocks[blockIndex]

    if (block.type === 'exercise') {
      if (currentRow === gridRow) {
        return -1 // This is not a circuit exercise
      }
      currentRow++
    } else if (block.type === 'circuit') {
      if (currentRow === gridRow) {
        return -1 // This is the circuit header
      }
      currentRow++ // Circuit header row

      if (blockIndex === circuitBlockIndex) {
        // We're in the right circuit block
        for (let i = 0; i < block.circuit.exercises.length; i++) {
          if (currentRow === gridRow) {
            return i
          }
          currentRow++
        }
      } else {
        // Skip exercises in other circuits
        currentRow += block.circuit.exercises.length
      }
    }
  }

  return -1
}
