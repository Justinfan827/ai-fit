import { cn } from "@/lib/utils";
import { ChangeEvent, KeyboardEvent, useRef, useState } from "react";

interface Position {
  row: number;
  col: number;
}

interface RowData {
  colType: string; // determines which column this row belongs to
  value: string; // the value of the cell
}

interface Columns {
  field: string; // the field of the column (rows use this to identify which column they belong to)
  header: string; // the header name of the column
}

const EditableGrid = ({
  rows = 3,
  cols = 3,
}: {
  rowData: RowData[];
  columns: Columns[];
}) => {
  const [grid, setGrid] = useState(
    Array.from({ length: rows }, () =>
      Array(cols).fill("Double-click to edit"),
    ),
  );
  const [editingCell, setEditingCell] = useState<Position | null>(null); // Tracks the editing cell
  const gridRefs = useRef<HTMLDivElement[][]>([]); // Ref array for all cells

  // Handles keyboard navigation
  const handleKeyDown = (e: KeyboardEvent, row: number, col: number) => {
    if (e.key === "Enter" && !editingCell) {
      setEditingCell({ row, col });
    } else if (e.key === "Escape") {
      setEditingCell(null);
      gridRefs.current[row][col]?.focus();
    } else {
      navigateGrid(e, row, col);
    }
  };

  // Navigation logic
  const navigateGrid = (e: KeyboardEvent, row: number, col: number) => {
    let newRow = row;
    let newCol = col;

    switch (e.key) {
      case "ArrowUp":
        newRow = Math.max(0, row - 1);
        break;
      case "k":
        if (!e.ctrlKey) {
          return;
        }
        newRow = Math.max(0, row - 1);
        break;
      case "ArrowDown":
        newRow = Math.min(rows - 1, row + 1);
        break;
      case "j":
        if (!e.ctrlKey) {
          return;
        }
        newRow = Math.min(rows - 1, row + 1);
        break;
      case "ArrowLeft":
        newCol = Math.max(0, col - 1);
        break;
      case "h":
        if (!e.ctrlKey) {
          return;
        }
        newCol = Math.max(0, col - 1);
        break;
      case "ArrowRight":
        newCol = Math.min(cols - 1, col + 1);
        break;
      case "l":
        if (!e.ctrlKey) {
          return;
        }
        newCol = Math.min(cols - 1, col + 1);
        break;
      default:
        return;
    }

    e.preventDefault();
    gridRefs.current[newRow][newCol]?.focus();
  };

  // Handles cell content change
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    row: number,
    col: number,
  ) => {
    const newGrid = [...grid];
    newGrid[row][col] = e.target.value;
    setGrid(newGrid);
  };

  // Handles blur of the input
  const handleInputBlur = () => {
    gridRefs.current[editingCell!.row][editingCell!.col]?.focus();
    setEditingCell(null);
  };

  return (
    <div
      className="m-2 grid text-sm"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(100px, 1fr))` }}
    >
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            ref={(el) => {
              gridRefs.current[rowIndex] = gridRefs.current[rowIndex] || [];
              gridRefs.current[rowIndex][colIndex] = el;
            }}
            tabIndex={0}
            className={cn(
              `relative cursor-pointer border-b border-r border-gray-200 p-2 focus-within:border focus-within:border-orange-500 focus-within:outline-none`,
              rowIndex === 0 && "border-t",
              colIndex === 0 && "border-l",
              colIndex !== 0 && "focus-within:-ml-px",
              rowIndex !== 0 && "focus-within:-mt-px",
            )}
            onClick={() => gridRefs.current[rowIndex][colIndex]?.focus()}
            onDoubleClick={() =>
              setEditingCell({ row: rowIndex, col: colIndex })
            }
            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
          >
            {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
              <input
                type="text"
                value={cell}
                onChange={(e) => handleInputChange(e, rowIndex, colIndex)}
                onBlur={handleInputBlur}
                autoFocus
                className="w-full focus:outline-none"
              />
            ) : (
              cell
            )}
          </div>
        )),
      )}
    </div>
  );
};

export default EditableGrid;
