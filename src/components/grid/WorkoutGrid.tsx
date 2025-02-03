import { ChangeEvent, KeyboardEvent, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import ExerciseInput from '@/components/grid/ExerciseInput'
import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Column } from './columns'

interface Position {
  row: number
  col: number
}

export interface Row {
  [key: string]: string
}

interface Cell {
  value: string
  colType: string
  width: number
}
export default function WorkoutGrid({
  onGridChange,
  rowData,
  columns,
}: {
  onGridChange: (grid: Row[]) => void
  rowData: Row[]
  columns: Column[]
}) {
  return (
    <div className="text-sm">
      <GridHeaderRow columns={columns} />
      <GridContentRows
        onGridChange={onGridChange}
        columns={columns}
        rowData={rowData}
      />
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
              'shrink-0 flex-grow border-r border-t border-neutral-800 bg-neutral-950 p-2 text-sm font-light uppercase tracking-wider text-neutral-400',
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
  rowData,
  onGridChange,
}: {
  columns: Column[]
  onGridChange: (grid: Row[]) => void
  rowData: Row[]
}) {
  // Handles keyboard navigation and cell activation
  const [rowDataS, setRowData] = useState(rowData)
  const rows = rowDataS.length
  const cols = columns.length
  const [grid, setGrid] = useState(newGrid(rowDataS, columns))
  const [activeCell, setActiveCell] = useState<Position | null>(null) // Renamed from editingCell for clarity
  const gridRefs = useRef<HTMLDivElement[][]>([])
  const handleKeyDown = (e: KeyboardEvent, row: number, col: number) => {
    if (activeCell) {
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault()
        const newCol = Math.max(0, col - 1)
        setActiveCell(null)
        gridRefs.current[row][newCol]?.focus()
        return
      }
      // Handle keys while cell is active
      if (e.key === 'Enter' || e.key === 'Escape') {
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
          newRow = Math.min(rows - 1, row + 1)
          break
        case 'ArrowLeft':
          newCol = Math.max(0, col - 1)
          break
        case 'ArrowRight':
          newCol = Math.min(cols - 1, col + 1)
          break
      }

      gridRefs.current[newRow][newCol]?.focus()
    } else if (e.key === 'Enter') {
      setActiveCell({ row, col })
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // If user starts typing, just activate the cell - don't set the value yet
      e.preventDefault() // Prevent the keypress from being handled twice
      const colType = grid[row][col].colType
      const newRows = rowDataS.map((r, idx) =>
        idx === row ? { ...r, [colType]: e.key } : r
      )
      setRowData(newRows)
      onGridChange(newRows)
      setGrid(newGrid(newRows, columns))
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
    const value = e.target.value
    const colType = grid[row][col].colType
    const newRows = rowDataS.map((r, idx) =>
      idx === row ? { ...r, [colType]: value } : r
    )

    setRowData(newRows)
    onGridChange(newRows)
    setGrid(newGrid(newRows, columns))
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
    onGridChange(newRows)
    setGrid(newGrid(newRows, columns))
    gridRefs.current[activeCell!.row][activeCell!.col]?.focus()
    setActiveCell(null)
  }

  const handleAddRow = (rowIndex: number, colIndex: number) => {
    const newRowData = [...rowDataS]
    newRowData.splice(rowIndex + 1, 0, {
      id: uuidv4().toString(),
    })
    setActiveCell({ row: rowIndex + 1, col: colIndex })
    setRowData(newRowData)
    onGridChange(newRowData)
    setGrid(newGrid(newRowData, columns))
  }

  return (
    <>
      {grid.map((row, rowIndex) => {
        return (
          <div key={`row-${rowIndex}`} className="group flex h-9 w-full">
            <div id="action menu" className="flex items-center px-2">
              <div className="">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-accent-foreground opacity-0 transition-opacity ease-in-out focus:opacity-100 group-hover:opacity-100"
                  onClick={() => handleAddRow(rowIndex, 0)}
                >
                  <Icons.plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-accent-foreground opacity-0 transition-opacity ease-in-out focus:opacity-100 group-hover:opacity-100"
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
                    gridRefs.current[rowIndex] =
                      gridRefs.current[rowIndex] || []
                    gridRefs.current[rowIndex][colIndex] = el
                  }
                }}
                tabIndex={0}
                className={cn(
                  `relative shrink-0 flex-grow cursor-pointer overflow-hidden border-b border-r border-neutral-800 p-2 focus-within:outline-none focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-500`,
                  rowIndex === 0 && 'border-t',
                  colIndex === 0 && 'border-l',
                  rowIndex === rows - 1 && colIndex === 0 && 'rounded-bl-sm',
                  rowIndex === rows - 1 &&
                    colIndex === cols - 1 &&
                    'rounded-br-sm'
                )}
                onClick={() => gridRefs.current[rowIndex][colIndex]?.focus()}
                onDoubleClick={() =>
                  setActiveCell({ row: rowIndex, col: colIndex })
                }
                onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                style={{
                  flexBasis: cell.width,
                }}
              >
                {activeCell?.row === rowIndex &&
                activeCell?.col === colIndex ? (
                  colIndex === 0 ? (
                    <ExerciseInput
                      value={cell.value || ''}
                      onSelect={(v) => {
                        handleOnSelectInput(v, rowIndex, colIndex)
                        gridRefs.current[rowIndex][colIndex]?.focus()
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
      })}
    </>
  )
}
function newGrid(rowData: Row[], columns: Column[]): Cell[][] {
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
