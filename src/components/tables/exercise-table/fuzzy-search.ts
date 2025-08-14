import type { FilterFn } from "@tanstack/react-table"
import Fuse from "fuse.js"
import type { TableExercise } from "./types"

// Global variable to store current search term and scores for sorting
let currentSearchTerm = ""
const fuzzyScores = new Map<string, number>()

export const fuzzyFilter: FilterFn<TableExercise> = (
  row,
  columnId,
  filterValue,
  addMeta
) => {
  // For global filtering, we only search the name column
  const exerciseName = row.getValue("name") as string
  const rowId = row.id

  // Update current search term
  if (currentSearchTerm !== filterValue) {
    currentSearchTerm = filterValue || ""
    fuzzyScores.clear()
  }

  if (!filterValue) {
    fuzzyScores.set(rowId, 0)
    return true
  }

  if (!exerciseName) {
    fuzzyScores.set(rowId, 0)
    return false
  }

  // Initialize Fuse with the exercise name
  const fuse = new Fuse([exerciseName], {
    includeScore: true,
    threshold: 0.3,
  })

  // Perform the fuzzy search
  const searchResults = fuse.search(filterValue)

  // If a match is found, consider the row as filtered
  if (searchResults.length > 0) {
    const score = searchResults[0].score ?? 1 // Fuse.js score (lower is better, 0 = perfect match)
    const normalizedScore = 1 - score // Convert to higher-is-better score for sorting
    fuzzyScores.set(rowId, normalizedScore)
    console.log("adding score", normalizedScore, columnId)
    addMeta({
      fuzzyScore: normalizedScore,
    })
    return true
  }

  fuzzyScores.set(rowId, 0)
  return false
}

// Export function to get fuzzy score for a row
export const getFuzzyScore = (rowId: string): number => {
  return fuzzyScores.get(rowId) ?? 0
}
