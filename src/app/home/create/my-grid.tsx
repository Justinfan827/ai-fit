import { cn } from '@/lib/utils'

import { useDrag } from '@use-gesture/react'
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'

import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react'
import { useSpring } from '@react-spring/web'

import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import useExercises from '@/hooks/use-exercises'

interface Position {
  row: number
  col: number
}

interface RowData {
  [key: string]: string
}

interface Columns {
  field: string // the field of the column (rows use this to identify which column they belong to)
  header: string // the header name of the column
  width?: number // the CSS width of the column
}

interface Cell {
  value: string
  colType: string
  width: number
}
export default function EditableGrid({
  rowData,
  columns,
}: {
  rowData: RowData[]
  columns: Columns[]
}) {
  // grid is represented by: a[row][col]
  const [rowDataS, setRowData] = useState(rowData)
  const rows = rowDataS.length
  const cols = columns.length
  const [grid, setGrid] = useState(newGrid(rowDataS, columns))
  const [editingCell, setEditingCell] = useState<Position | null>(null) // Tracks the editing cell
  console.log({ editingCell })

  const pendingFocusRef = useRef(null)
  const gridRefs = useRef<HTMLDivElement[][]>([]) // Ref array for all cells

  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }))

  // Set the drag hook and define component movement based on gesture data.
  const bind = useDrag(({ down, movement: [mx, my] }) => {
    api.start({ x: down ? mx : 0, y: down ? my : 0 })
  })

  useEffect(() => {
    if (pendingFocusRef.current) {
      const { row, col } = pendingFocusRef.current
      // Wait for DOM updates to complete before focusing
      setTimeout(() => {
        gridRefs.current[row]?.[col]?.focus()
        pendingFocusRef.current = null // Clear the pending focus
      }, 0)
    }
    console.log('new grid', grid)
  }, [grid]) // Trigger effect when grid updates

  // Handles keyboard navigation
  const handleKeyDown = (e: KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Enter') {
      setEditingCell({ row, col })
      if (e.metaKey) {
        handleAddRow(row, col)
        e.preventDefault()
        e.stopPropagation()
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null)
      gridRefs.current[row][col]?.focus()
    } else if (e.key === 'Backspace') {
      if (e.metaKey) {
        // delete current row
        const newRowData = rowDataS.filter((_, idx) => idx !== row)
        setRowData(newRowData)
        setGrid(newGrid(newRowData, columns))
      }
    } else {
      navigateGrid(e, row, col)
    }
  }

  // Navigation logic
  const navigateGrid = (e: KeyboardEvent, row: number, col: number) => {
    let newRow = row
    let newCol = col

    switch (e.key) {
      case 'ArrowUp':
        newRow = Math.max(0, row - 1)
        break
      case 'k':
        if (editingCell) return // disable vim keybindings when editing
        if (e.ctrlKey) {
          // move the current row up
          const newRowData = swapArrayElements(rowDataS, row, row - 1)
          console.log({ newRowData })
          setRowData(newRowData)
          setGrid(newGrid(newRowData, columns))
        }
        newRow = Math.max(0, row - 1)
        break
      case 'ArrowDown':
        newRow = Math.min(rows - 1, row + 1)
        break
      case 'j':
        if (editingCell) return // disable vim keybindings when editing
        if (e.ctrlKey) {
          // move the current row down
          const newRowData = swapArrayElements(rowDataS, row, row + 1)
          console.log({ newRowData })
          setRowData(newRowData)
          setGrid(newGrid(newRowData, columns))
        }
        newRow = Math.min(rows - 1, row + 1)
        break
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1)
        break
      case 'h':
        if (editingCell) return // disable vim keybindings when editing
        newCol = Math.max(0, col - 1)
        break
      case 'ArrowRight':
        newCol = Math.min(cols - 1, col + 1)
        break
      case 'l':
        if (editingCell) return // disable vim keybindings when editing
        newCol = Math.min(cols - 1, col + 1)
        break
      default:
        return
    }
    e.preventDefault()
    gridRefs.current[newRow][newCol]?.focus()
    if (!!editingCell) {
      setEditingCell({ row: newRow, col: newCol })
    }
  }

  // Handles cell content change
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    row: number,
    col: number
  ) => {
    const value = e.target.value
    console.log({ value })
    handleOnSelectInput(value, row, col)
  }

  const handleOnSelectInput = (value: string, row: number, col: number) => {
    const colType = grid[row][col].colType
    const newRows = rowDataS.map((r, idx) => {
      if (row !== idx) return r
      return {
        ...r,
        [colType]: value,
      }
    })

    setRowData(newRows)
    setGrid(newGrid(newRows, columns))
  }

  // Handles blur of the input
  const handleInputBlur = () => {
    gridRefs.current[editingCell!.row][editingCell!.col]?.focus()
    setEditingCell(null)
  }

  const handleAddRow = (rowIndex: number, colIndex: number) => {
    const newRowData = [...rowDataS]
    newRowData.splice(rowIndex + 1, 0, {})
    pendingFocusRef.current = { row: rowIndex + 1, col: colIndex }
    setRowData(newRowData)
    setGrid(newGrid(newRowData, columns))
  }

  return (
    <div className="flex-row text-sm">
      <div id="column-names" className="flex w-full">
        <div id="action menu" className="flex px-2">
          <div className="">
            <Button size="icon" variant="ghost" className="invisible h-6 w-6">
              <Icons.plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="">
            <Button size="icon" variant="ghost" className="invisible h-6 w-6">
              <Icons.gripVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {columns.map((col, idx) => {
          return (
            <div
              className={cn(
                'shrink-0 flex-grow border-r border-t border-neutral-800 bg-neutral-950 p-2 text-sm font-light uppercase tracking-wider text-neutral-400',
                idx === 0 && 'rounded-tl-sm border-l',
                idx === cols - 1 && 'rounded-tr-sm'
              )}
              key={col.field}
              style={{ flexBasis: col.width }}
            >
              {col.header}
            </div>
          )
        })}
      </div>
      {grid.map((row, rowIndex) => {
        return (
          <div key={`row-${rowIndex}`} className="group flex h-9 w-full">
            <div id="action menu" className="flex px-2">
              <div className="">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-accent-foreground opacity-0 transition-opacity ease-in-out group-hover:opacity-100"
                  onClick={() => handleAddRow(rowIndex)}
                >
                  <Icons.plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-accent-foreground opacity-0 transition-opacity ease-in-out group-hover:opacity-100"
                >
                  <Icons.gripVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                ref={(el) => {
                  gridRefs.current[rowIndex] = gridRefs.current[rowIndex] || []
                  gridRefs.current[rowIndex][colIndex] = el
                }}
                tabIndex={0}
                className={cn(
                  `relative shrink-0 flex-grow cursor-pointer border-b border-r border-neutral-800 p-2 focus-within:outline-none focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-500`,
                  rowIndex === 0 && 'border-t',
                  colIndex === 0 && 'border-l',
                  // colIndex !== 0 && "focus-within:-ml-px",
                  // rowIndex !== 0 && "focus-within:-mt-px",
                  editingCell?.row === rowIndex &&
                    editingCell.col === colIndex &&
                    'p-0',

                  rowIndex === rows - 1 && colIndex === 0 && 'rounded-bl-sm',
                  rowIndex === rows - 1 &&
                    colIndex === cols - 1 &&
                    'rounded-br-sm'
                )}
                onClick={() => gridRefs.current[rowIndex][colIndex]?.focus()}
                onDoubleClick={() =>
                  setEditingCell({ row: rowIndex, col: colIndex })
                }
                onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                style={{
                  flexBasis: cell.width,
                }}
              >
                {editingCell?.row === rowIndex &&
                editingCell?.col === colIndex ? (
                  colIndex === 0 ? (
                    <ExInput
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                      value={cell.value || ''}
                      onChange={(e) => handleInputChange(e, rowIndex, colIndex)}
                      onSelect={(v) =>
                        handleOnSelectInput(v, rowIndex, colIndex)
                      }
                      onBlur={handleInputBlur}
                    />
                  ) : (
                    <input
                      className="h-full w-full bg-neutral-950 p-2 text-sm focus-within:outline-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                      value={cell.value || ''}
                      onChange={(e) => handleInputChange(e, rowIndex, colIndex)}
                      onBlur={handleInputBlur}
                      autoFocus
                      onClick={() =>
                        gridRefs.current[rowIndex][colIndex]?.focus()
                      }
                      onDoubleClick={() =>
                        setEditingCell({ row: rowIndex, col: colIndex })
                      }
                    />
                  )
                ) : (
                  cell?.value
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function ExInput({
  value,
  onChange,
  onSelect,
  onBlur,
  onKeyDown,
}: {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onSelect: (v: string) => void
  onKeyDown: (e: KeyboardEvent) => void
  onBlur: () => void
}) {
  const { isPending, exercises } = useExercises({ searchTerm: value })

  return (
    <Combobox value={value} onChange={onSelect}>
      <ComboboxInput
        onChange={onChange}
        onBlur={onBlur}
        autoFocus
        onKeyDown={onKeyDown}
        value={value}
        className="h-full w-full bg-neutral-950 p-2 text-sm focus-within:outline-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
      />
      <ComboboxOptions
        anchor={{
          to: 'bottom start',
          offset: '-1px',
        }}
        transition
        className="w-[calc(var(--input-width)+2px)] rounded-b-sm border border-border bg-neutral-950 p-1 text-sm shadow-lg empty:invisible"
      >
        {exercises?.map((exercise) => {
          return (
            <ComboboxOption
              value={exercise.name}
              key={exercise.id}
              className="cursor-default select-none rounded-sm bg-neutral-950 p-1 focus:outline-none data-[focus]:bg-neutral-900 data-[selected]:text-accent-foreground"
            >
              {exercise.name}
            </ComboboxOption>
          )
        })}
      </ComboboxOptions>
    </Combobox>
  )
}

function swapArrayElements(arr: any[], idx1: number, idx2: number) {
  console.log({ arr })
  if (idx1 < 0 || idx2 < 0 || idx1 >= arr.length || idx2 >= arr.length) {
    return arr
  }
  const copy = [...arr]
  const temp = copy[idx1]
  copy[idx1] = copy[idx2]
  copy[idx2] = temp
  return copy
}

function newGrid(rowData: RowData[], columns: Columns[]): Cell[][] {
  const gg = Array.from({ length: rowData.length }, () =>
    Array(columns.length).fill(null)
  )

  for (let i = 0; i < rowData.length; i++) {
    const row = rowData[i]
    for (let j = 0; j < columns.length; j++) {
      const col = columns[j]
      gg[i][j] = {
        value: row[col.field],
        colType: col.field,
        width: col.width,
      }
    }
  }
  return gg
}
