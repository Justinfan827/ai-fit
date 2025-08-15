/**
 * Script to parse exercises.txt file and insert exercises and muscle groups into Supabase database
 *
 * The exercises.txt file has the following format:
 * Category:
 * * Exercise Name
 * * Another Exercise
 *
 * Categories map to muscle groups in the database
 */

import fs from "node:fs"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

interface Exercise {
  name: string
  muscleGroups: string[]
  category: string
}

interface MuscleGroup {
  name: string
}

function parseExercisesFile(filePath: string): {
  exercises: Exercise[]
  muscleGroups: Set<string>
} {
  const content = fs.readFileSync(filePath, "utf8")
  const lines = content.split("\n")

  const exercises: Exercise[] = []
  const muscleGroups = new Set<string>()
  let currentCategory = ""

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Skip empty lines
    if (!trimmedLine) continue

    // Check if this is a category line (ends with colon)
    if (trimmedLine.endsWith(":")) {
      currentCategory = trimmedLine.slice(0, -1).trim()
      muscleGroups.add(currentCategory)
      continue
    }

    // Check if this is an exercise line (starts with *)
    if (trimmedLine.startsWith("*")) {
      const exerciseName = trimmedLine.slice(1).trim()
      if (exerciseName && currentCategory) {
        exercises.push({
          name: exerciseName,
          muscleGroups: [currentCategory],
          category: currentCategory,
        })
      }
    }
  }

  return { exercises, muscleGroups }
}

async function insertMuscleGroups(supabase: any, muscleGroups: Set<string>) {
  console.log("Inserting muscle groups...")

  // Check which muscle groups already exist
  const { data: existingGroups, error: fetchError } = await supabase
    .from("muscle_groups")
    .select("name")

  if (fetchError) {
    console.error("Error fetching existing muscle groups:", fetchError)
    return null
  }

  const existingNames = new Set(existingGroups?.map((g: any) => g.name) || [])
  const newGroups = Array.from(muscleGroups).filter(
    (name) => !existingNames.has(name)
  )

  if (newGroups.length === 0) {
    console.log("All muscle groups already exist")
    return existingGroups
  }

  const { data, error } = await supabase
    .from("muscle_groups")
    .insert(newGroups.map((name) => ({ name })))
    .select()

  if (error) {
    console.error("Error inserting muscle groups:", error)
    return null
  }

  console.log(
    `Inserted ${data.length} new muscle groups:`,
    data.map((g: any) => g.name)
  )
  return data
}

async function insertExercises(supabase: any, exercises: Exercise[]) {
  console.log("Inserting exercises...")

  // Get all muscle groups with their IDs
  const { data: muscleGroupsData, error: muscleGroupsError } = await supabase
    .from("muscle_groups")
    .select("id, name")

  if (muscleGroupsError) {
    console.error("Error fetching muscle groups:", muscleGroupsError)
    return
  }

  const muscleGroupMap = new Map(
    muscleGroupsData.map((mg: any) => [mg.name, mg.id])
  )

  // Check which exercises already exist
  const { data: existingExercises, error: fetchError } = await supabase
    .from("exercises")
    .select("name")

  if (fetchError) {
    console.error("Error fetching existing exercises:", fetchError)
    return
  }

  const existingNames = new Set(
    existingExercises?.map((e: any) => e.name) || []
  )
  const newExercises = exercises.filter(
    (exercise) => !existingNames.has(exercise.name)
  )

  if (newExercises.length === 0) {
    console.log("All exercises already exist")
    return
  }

  // Insert exercises
  const { data: insertedExercises, error: exerciseError } = await supabase
    .from("exercises")
    .insert(
      newExercises.map((exercise) => ({
        name: exercise.name,
        tags: exercise.category,
        notes: `Exercise from ${exercise.category} category`,
      }))
    )
    .select()

  if (exerciseError) {
    console.error("Error inserting exercises:", exerciseError)
    return
  }

  console.log(`Inserted ${insertedExercises.length} new exercises`)

  // Create exercise-muscle group associations
  const associations = []
  for (const exercise of insertedExercises) {
    const originalExercise = newExercises.find((e) => e.name === exercise.name)
    if (originalExercise) {
      for (const muscleGroupName of originalExercise.muscleGroups) {
        const muscleGroupId = muscleGroupMap.get(muscleGroupName)
        if (muscleGroupId) {
          associations.push({
            exercise_id: exercise.id,
            muscle_group_id: muscleGroupId,
          })
        }
      }
    }
  }

  if (associations.length > 0) {
    const { error: associationError } = await supabase
      .from("exercise_muscle_groups")
      .insert(associations)

    if (associationError) {
      console.error(
        "Error creating exercise-muscle group associations:",
        associationError
      )
    } else {
      console.log(
        `Created ${associations.length} exercise-muscle group associations`
      )
    }
  }
}

const allowedMuscleGroups = new Set([
  "Chest",
  "Shoulders",
  "Triceps",
  "Biceps",
  "Upper Back",
  "Traps",
  "Forearms",
  "Abs",
  "Obliques",
  "Lower Back",
  "Calves",
  "Hamstrings",
  "Glutes",
  "Quads",
  "Hip Flexors",
  "Adductors",
])

async function seedExercises({
  supabaseServiceRoleKey,
  supabaseURL,
}: {
  supabaseServiceRoleKey: string
  supabaseURL: string
}) {
  const supabase = createClient<Database>(supabaseURL, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Parse the exercises file
    const exercisesFilePath = path.join(__dirname, "exercises.txt")
    const { exercises, muscleGroups } = parseExercisesFile(exercisesFilePath)

    console.log(
      `Found ${exercises.length} exercises across ${muscleGroups.size} muscle groups`
    )
    console.log("Muscle groups:", Array.from(muscleGroups))
    // Check muscle groups are valid
    for (const muscleGroup of Array.from(muscleGroups)) {
      if (!allowedMuscleGroups.has(muscleGroup)) {
        console.error(`Invalid muscle group: ${muscleGroup}`)
        process.exit(1)
      }
    }

    // Insert muscle groups first
    await insertMuscleGroups(supabase, muscleGroups)

    // Insert exercises and create associations
    await insertExercises(supabase, exercises)

    console.log("✅ Successfully seeded exercises and muscle groups!")
  } catch (error) {
    console.error("❌ Error seeding exercises:", error)
    process.exit(1)
  }
}

// Run the script if called directly
if (require.main === module) {
  seedExercises()
}

export { type seedExercises, parseExercisesFile }
