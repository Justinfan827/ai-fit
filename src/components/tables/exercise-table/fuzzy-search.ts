import type { FilterFn } from "@tanstack/react-table"
import Fuse from "fuse.js"
import type { TableExercise } from "./types"

export const fuzzyFilter: FilterFn<TableExercise> = (
  row,
  columnId,
  filterValue,
  addMeta
) => {
  const value = row.getValue(columnId) as string
  // Initialize Fuse with the value of the current cell
  const fuse = new Fuse([value], {
    includeScore: true, // Optional: include a score in the results
    // Add other Fuse.js options as needed
    threshold: 0.4,
    // sort by score
  })

  // Perform the fuzzy search
  const searchResults = fuse.search(filterValue)

  // If a match is found, consider the row as filtered
  if (searchResults.length > 0) {
    addMeta({ searchResults }) // Optional: add metadata for inspection
    return true
  }
  return false
}
