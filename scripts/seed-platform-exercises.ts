import fs from "node:fs"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import type { DBClient } from "@/lib/supabase/types"

interface Exercise {
  name: string
  muscleGroup: string
}

function parseExercisesCSV(filePath: string): {
  exercises: Exercise[]
  muscleGroups: Set<string>
} {
  const content = fs.readFileSync(filePath, "utf-8")
  const lines = content.trim().split("\n")

  // Skip header row
  const dataLines = lines.slice(1)

  const exercises: Exercise[] = []
  const muscleGroups = new Set<string>()

  for (const line of dataLines) {
    if (!line.trim()) continue

    const [muscleGroup, exerciseName] = line.split(",").map((s) => s.trim())

    if (muscleGroup && exerciseName) {
      exercises.push({
        name: exerciseName,
        muscleGroup,
      })
      muscleGroups.add(muscleGroup)
    }
  }

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
  muscleGroups: Set<string>
) {
  console.log("Inserting muscle group category values...")

  // Check which muscle group values already exist
  const { data: existingValues, error: fetchError } = await supabase
    .from("category_values")
    .select("name")
    .eq("category_id", categoryId)
    .is("deleted_at", null)

  if (fetchError) {
    console.error("Error fetching existing category values:", fetchError)
    return null
  }

  const existingNames = new Set(existingValues?.map((v) => v.name) || [])
  const newValues = Array.from(muscleGroups).filter(
    (name) => !existingNames.has(name)
  )

  if (newValues.length === 0) {
    console.log("All muscle group values already exist")
    return existingValues
  }

  const { data, error } = await supabase
    .from("category_values")
    .insert(
      newValues.map((name) => ({
        name,
        category_id: categoryId,
        description: `${name} muscle group`,
      }))
    )
    .select()

  if (error) {
    console.error("Error inserting category values:", error)
    return null
  }

  console.log(
    `Inserted ${data.length} new muscle group values:`,
    data.map((v: any) => v.name)
  )
  return data
}

async function insertExercises(
  supabase: any,
  exercises: Exercise[],
  categoryId: string
) {
  console.log("Inserting exercises...")

  // Get all category values (muscle groups) with their IDs
  const { data: categoryValuesData, error: categoryValuesError } =
    await supabase
      .from("category_values")
      .select("id, name")
      .eq("category_id", categoryId)
      .is("deleted_at", null)

  if (categoryValuesError) {
    console.error("Error fetching category values:", categoryValuesError)
    return
  }

  const muscleGroupMap = new Map(
    categoryValuesData.map((cv: any) => [cv.name, cv.id])
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
    // Still need to create category assignments for existing exercises that might not have them
    await createCategoryAssignments(supabase, exercises, muscleGroupMap)
    return
  }

  // Insert exercises
  const { data: insertedExercises, error: exerciseError } = await supabase
    .from("exercises")
    .insert(
      newExercises.map((exercise) => ({
        name: exercise.name,
        owner_id: null, // Platform exercises have null owner_id
        notes: `Exercise targeting ${exercise.muscleGroup}`,
      }))
    )
    .select()

  if (exerciseError) {
    console.error("Error inserting exercises:", exerciseError)
    return
  }

  console.log(`Inserted ${insertedExercises.length} new exercises`)

  // Create category assignments for new exercises
  await createCategoryAssignments(supabase, newExercises, muscleGroupMap)
}

async function createCategoryAssignments(
  supabase: any,
  exercises: Exercise[],
  muscleGroupMap: Map<string, string>
) {
  console.log("Creating category assignments...")

  // Get all exercises with their IDs
  const exerciseNames = exercises.map((e) => e.name)
  const { data: exercisesData, error: exercisesError } = await supabase
    .from("exercises")
    .select("id, name")
    .in("name", exerciseNames)

  if (exercisesError) {
    console.error("Error fetching exercises:", exercisesError)
    return
  }

  const exerciseMap = new Map(exercisesData.map((e: any) => [e.name, e.id]))

  // Create category assignments
  const assignments = []
  for (const exercise of exercises) {
    const exerciseId = exerciseMap.get(exercise.name)
    const categoryValueId = muscleGroupMap.get(exercise.muscleGroup)

    if (exerciseId && categoryValueId) {
      assignments.push({
        exercise_id: exerciseId,
        category_value_id: categoryValueId,
      })
    }
  }

  if (assignments.length === 0) {
    console.log("No category assignments to create")
    return
  }

  // Check for existing assignments to avoid duplicates
  const exerciseIds = assignments.map((a) => a.exercise_id)
  const categoryValueIds = assignments.map((a) => a.category_value_id)

  const { data: existingAssignments, error: fetchAssignmentsError } =
    await supabase
      .from("category_assignments")
      .select("exercise_id, category_value_id")
      .in("exercise_id", exerciseIds)
      .in("category_value_id", categoryValueIds)

  if (fetchAssignmentsError) {
    console.error("Error fetching existing assignments:", fetchAssignmentsError)
    return
  }

  const existingSet = new Set(
    existingAssignments?.map(
      (a: any) => `${a.exercise_id}-${a.category_value_id}`
    ) || []
  )

  const newAssignments = assignments.filter(
    (assignment) =>
      !existingSet.has(
        `${assignment.exercise_id}-${assignment.category_value_id}`
      )
  )

  if (newAssignments.length === 0) {
    console.log("All category assignments already exist")
    return
  }

  const { error: assignmentError } = await supabase
    .from("category_assignments")
    .upsert(newAssignments, {
      onConflict: "exercise_id,category_value_id",
      ignoreDuplicates: true,
    })

  if (assignmentError) {
    console.error("Error creating category assignments:", assignmentError)
  } else {
    console.log(`Created ${newAssignments.length} category assignments`)
  }
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
    console.log("Muscle groups:", Array.from(muscleGroups))

    // Step 1: Create the "Muscle Groups" category
    const categoryId = await createMuscleGroupCategory(supabase, userId)
    if (!categoryId) {
      console.error("Failed to create or find 'Muscle Groups' category")
      process.exit(1)
    }

    // Step 2: Insert muscle group category values
    await insertCategoryValues(supabase, categoryId, muscleGroups)

    // Step 3: Insert exercises and create category assignments
    await insertExercises(supabase, exercises, categoryId)

    console.log("✅ Successfully seeded exercises with categories!")
  } catch (error) {
    console.error("❌ Error seeding exercises:", error)
    process.exit(1)
  }
}

export { seedExercises, parseExercisesCSV }
