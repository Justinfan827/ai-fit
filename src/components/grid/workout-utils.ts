import type { Workout } from "@/lib/domain/workouts"

/*
 * Groups workouts by week.
 */
function groupWorkoutsByWeek(workouts: Workout[]): Workout[][] {
  return workouts.reduce((acc, w) => {
    const week = w.week || 0
    if (!acc[week]) {
      acc[week] = []
    }
    acc[week].push(w)
    return acc
  }, [] as Workout[][])
}

export { groupWorkoutsByWeek }
