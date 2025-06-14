import { ChangeEvent, KeyboardEvent, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import AddRowDropdown from '@/components/grid/AddRowDropdown'
import ExerciseInput from '@/components/grid/ExerciseInput'
import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Exercise, ExerciseBlock, Workout } from '@/lib/domain/workouts'
import { cn } from '@/lib/utils'
import { Column } from './columns'

interface Position {
  row: number
  col: number
}

interface CellChange {
  row: number
  col: number
  field: string
  oldValue: string
  newValue: string
}

interface ExerciseSelection {
  row: number
  col: number
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
  return 'exercise' in change
}

function isCellChange(change: GridChange): change is CellChange {
  return 'field' in change
}

interface Cell {
  type: 'input' | 'select' | 'display'
  value: string
  colType: string
  width: number
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
  return (
    <div className="text-sm">
      <GridHeaderRow columns={columns} />
      <GridContentRows
        workout={workout}
        onWorkoutChange={onWorkoutChange}
        columns={columns}
      />
      <pre>{JSON.stringify(workout, null, 2)}</pre>
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
  const gridRefs = useRef<HTMLDivElement[][]>([])

  // Incremental update handler
  const handleGridChange = (change: GridChange) => {
    const updatedWorkout = applyIncrementalChange(change, workout)
    onWorkoutChange(updatedWorkout)
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
        setActiveCell(null)
        const nextRow = Math.min(numRows - 1, row + 1)
        gridRefs.current[nextRow][col]?.focus()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setActiveCell(null)
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
      setActiveCell({ row, col })
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // If user starts typing, just activate the cell - don't set the value yet
      e.preventDefault() // Prevent the keypress from being handled twice
      const field = grid[row][col].colType
      const oldValue = grid[row][col].value

      const change: CellChange = {
        row,
        col,
        field,
        oldValue,
        newValue: e.key,
      }

      handleGridChange(change)
      setActiveCell({ row, col })
      // The input will receive focus and handle the keypress normally
    }
  }

  // Simplified input change handler
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    row: number,
    col: number
  ) => {
    const newValue = e.target.value
    const field = grid[row][col].colType
    const oldValue = grid[row][col].value

    const change: CellChange = {
      row,
      col,
      field,
      oldValue,
      newValue,
    }

    handleGridChange(change)
  }

  const handleOnSelectInput = (value: string, row: number, col: number) => {
    const field = grid[row][col].colType
    const oldValue = grid[row][col].value

    const change: CellChange = {
      row,
      col,
      field,
      oldValue,
      newValue: value,
    }

    handleGridChange(change)
    gridRefs.current[activeCell!.row][activeCell!.col]?.focus()
    setActiveCell(null)
  }

  const handleOnSelectExercise = (
    exercise: Exercise,
    row: number,
    col: number
  ) => {
    // Get the current exercise data for comparison
    const currentBlock = workout.blocks[row]
    const oldExercise =
      currentBlock?.type === 'exercise'
        ? { id: currentBlock.exercise.id, name: currentBlock.exercise.name }
        : { id: '', name: '' }

    const change: ExerciseSelection = {
      row,
      col,
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
            handleOnSelectInput={handleOnSelectInput}
            handleOnSelectExercise={handleOnSelectExercise}
            handleInputChange={handleInputChange}
            handleKeyDown={handleKeyDown}
            setActiveCell={setActiveCell}
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
  handleOnSelectInput: (value: string, row: number, col: number) => void
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
}

function GridContentRow({
  row,
  numRows,
  numCols,
  activeCell,
  rowIndex,
  openDropdownRow,
  handleAddRow,
  handleOnSelectInput,
  handleOnSelectExercise,
  handleInputChange,
  handleKeyDown,
  setActiveCell,
  setOpenDropdownRow,
  gridRefs,
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
          className={cn(
            `relative shrink-0 flex-grow cursor-pointer overflow-hidden border-r border-b border-neutral-800 p-2 focus-within:ring-2 focus-within:ring-orange-500 focus-within:outline-none focus-within:ring-inset`,
            rowIndex === 0 && 'border-t',
            colIndex === 0 && 'border-l',
            rowIndex === numRows - 1 && colIndex === 0 && 'rounded-bl-sm',
            rowIndex === numRows - 1 &&
              colIndex === numCols - 1 &&
              'rounded-br-sm'
          )}
          onClick={() => gridRefs.current[rowIndex][colIndex]?.focus()}
          onDoubleClick={() => setActiveCell({ row: rowIndex, col: colIndex })}
          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
          style={{
            flexBasis: cell.width,
          }}
        >
          {activeCell?.row === rowIndex && activeCell?.col === colIndex ? (
            colIndex === 0 ? (
              <ExerciseInput
                value={cell.value || ''}
                onSelectExercise={(exercise) => {
                  handleOnSelectExercise(exercise, rowIndex, colIndex)
                }}
                onBlur={() => setActiveCell(null)}
              />
            ) : (
              <input
                className="m-0 h-full w-full bg-neutral-950 py-2 text-sm focus-within:outline-none focus:outline-none"
                value={cell.value || ''}
                onChange={(e) => handleInputChange(e, rowIndex, colIndex)}
                onBlur={() => setActiveCell(null)}
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
  const exerciseBlocks = workout.blocks.filter(
    (b): b is ExerciseBlock => b.type === 'exercise'
  )

  return exerciseBlocks.map((block) =>
    columns.map((col) => ({
      type:
        col.field === 'exercise_name'
          ? ('select' as const)
          : ('input' as const),
      value: getValueFromBlock(block, col.field),
      colType: col.field,
      width: col.width || 100,
    }))
  )
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

// Incremental update function
function applyIncrementalChange(change: GridChange, workout: Workout): Workout {
  const newBlocks = [...workout.blocks]
  const blockToUpdate = newBlocks[change.row]

  if (blockToUpdate?.type === 'exercise') {
    const updatedBlock = { ...blockToUpdate }

    if (isExerciseSelection(change)) {
      // Handle exercise selection - update both id and name
      updatedBlock.exercise = {
        ...updatedBlock.exercise,
        id: change.exercise.id,
        name: change.exercise.name,
      }
    } else if (isCellChange(change)) {
      // Handle regular field changes
      if (change.field === 'exercise_name') {
        updatedBlock.exercise = {
          ...updatedBlock.exercise,
          name: change.newValue,
        }
      } else {
        updatedBlock.exercise = {
          ...updatedBlock.exercise,
          metadata: {
            ...updatedBlock.exercise.metadata,
            [change.field]: change.newValue,
          },
        }
      }
    }

    newBlocks[change.row] = updatedBlock
  }

  return {
    ...workout,
    blocks: newBlocks,
  }
}
