import fs from "node:fs"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import type { DBClient } from "@/lib/supabase/types"

interface Exercise {
  name: string
  muscleGroups: string[]
}

interface ExerciseWithCategoryAssignments {
  name: string
  categoryValueAssignmentIDs: string[]
}

interface ExerciseWithCategoryAssignmentsAndIDs
  extends ExerciseWithCategoryAssignments {
  id: string
}

function parseExercisesCSV(filePath: string): {
  exercises: Exercise[]
  muscleGroups: Set<string>
} {
  const content = fs.readFileSync(filePath, "utf-8")
  const lines = content.trim().split("\n")

  // Skip header row
  const dataLines = lines.slice(1)

  const exerciseMap = new Map<string, Set<string>>()
  const muscleGroups = new Set<string>()

  for (const line of dataLines) {
    if (!line.trim()) continue

    const [muscleGroup, exerciseName] = line.split(",").map((s) => s.trim())

    if (muscleGroup && exerciseName) {
      // Group exercises by name and collect muscle groups
      if (!exerciseMap.has(exerciseName)) {
        exerciseMap.set(exerciseName, new Set())
      }
      exerciseMap.get(exerciseName)?.add(muscleGroup)
      muscleGroups.add(muscleGroup)
    }
  }

  // Convert to Exercise array
  const exercises: Exercise[] = Array.from(exerciseMap.entries()).map(
    ([name, muscleGroupSet]) => ({
      name,
      muscleGroups: Array.from(muscleGroupSet),
    })
  )

  return { exercises, muscleGroups }
}

async function createMuscleGroupCategory(
  supabase: DBClient,
  userId: string
): Promise<string | null> {
  console.log("Creating 'Muscle Groups' category...")

  // Check if the category already exists
  const { data: existingCategory, error: fetchError } = await supabase
    .from("categories")
    .select("id")
    .eq("name", "Muscle Groups")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle()

  if (fetchError) {
    console.error("Error checking for existing category:", fetchError)
    return null
  }

  if (existingCategory) {
    console.log("'Muscle Groups' category already exists")
    return existingCategory.id
  }

  // Create the category
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: "Muscle Groups",
      description: "Primary muscle groups targeted by exercises",
      user_id: userId,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating 'Muscle Groups' category:", error)
    return null
  }

  console.log("Created 'Muscle Groups' category")
  return data.id
}

async function insertCategoryValues(
  supabase: DBClient,
  categoryId: string,
  muscleGroups: string[]
) {
  console.log("Inserting muscle group category values...")
  const { data } = await supabase
    .from("category_values")
    .insert(
      muscleGroups.map((name) => ({
        name,
        category_id: categoryId,
        description: `${name} muscle group`,
      }))
    )
    .select()
    .throwOnError()

  console.log(
    `Inserted ${data.length} new muscle group values:`,
    data.map((v) => v.name)
  )
  return data
}

async function insertExercises(
  supabase: DBClient,
  exercises: ExerciseWithCategoryAssignments[],
  ownerId: string
) {
  console.log("Inserting exercises...")
  const { data: insertedExercises } = await supabase
    .from("exercises")
    .insert(
      exercises.map((exercise) => ({
        name: exercise.name,
        owner_id: ownerId,
      }))
    )
    .select()
    .throwOnError()

  console.log(
    `Inserted ${insertedExercises.length} new exercises`,
    insertedExercises.map((e) => e.name)
  )

  const exercisesWithIDs: ExerciseWithCategoryAssignmentsAndIDs[] =
    exercises.map((e) => ({
      ...e,
      id: insertedExercises.find((exercise) => exercise.name === e.name)?.id!,
    }))

  // Create category assignments for new exercises
  await createCategoryAssignments(supabase, exercisesWithIDs)
}

async function createCategoryAssignments(
  supabase: DBClient,
  exercises: ExerciseWithCategoryAssignmentsAndIDs[]
) {
  console.log("Creating category assignments...")
  const { data: insertedAssignments } = await supabase
    .from("category_assignments")
    .insert(
      exercises.flatMap((e) => {
        return e.categoryValueAssignmentIDs.map((cv) => ({
          exercise_id: e.id,
          category_value_id: cv,
        }))
      })
    )
    .select()
    .throwOnError()

  console.log(
    `Created ${insertedAssignments.length} category assignments`,
    insertedAssignments.map((a) => `${a.exercise_id}-${a.category_value_id}`)
  )
}

async function seedExercises({
  userId,
  supabaseServiceRoleKey,
  supabaseURL,
}: {
  userId: string
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
    // Parse the exercises CSV file
    const exercisesFilePath = path.join(__dirname, "exercises.csv")
    const { exercises, muscleGroups } = parseExercisesCSV(exercisesFilePath)

    console.log(
      `Found ${exercises.length} exercises across ${muscleGroups.size} muscle groups`
    )

    // Step 1: Create the "Muscle Groups" category
    const categoryId = await createMuscleGroupCategory(supabase, userId)
    if (!categoryId) {
      console.error("Failed to create or find 'Muscle Groups' category")
      process.exit(1)
    }

    // Step 2: Insert muscle group category values
    const categoryValues = await insertCategoryValues(
      supabase,
      categoryId,
      Array.from(muscleGroups)
    )
    const exerciseWithIDs: ExerciseWithCategoryAssignments[] = exercises.map(
      (exercise) => ({
        name: exercise.name,
        categoryValueAssignmentIDs: categoryValues
          .filter((cv) => exercise.muscleGroups.includes(cv.name))
          .map((cv) => cv.id),
      })
    )

    // Step 3: Insert exercises and create category assignments
    await insertExercises(supabase, exerciseWithIDs, userId)

    console.log("✅ Successfully seeded exercises with categories!")
  } catch (error) {
    console.error("❌ Error seeding exercises:", error)
    process.exit(1)
  }
}

export { seedExercises, parseExercisesCSV }
