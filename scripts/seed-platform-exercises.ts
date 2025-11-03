import fs from "node:fs"
import path from "node:path"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"

interface Exercise {
  name: string
  muscleGroups: string[]
}

interface ExerciseWithCategoryAssignments {
  name: string
  categoryValueAssignmentIDs: Id<"categoryValues">[]
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
  client: ConvexHttpClient,
  userId: Id<"users">
): Promise<Id<"categories"> | null> {
  console.log("Creating 'Muscle Groups' category...")

  try {
    // Check if the category already exists
    const categories = await client.query(
      api.exercises.getCategoriesWithValues,
      {
        userId,
      }
    )

    const existingCategory = categories.find(
      (cat) => cat.name === "Muscle Groups"
    )

    if (existingCategory) {
      console.log("'Muscle Groups' category already exists")
      return existingCategory._id
    }

    // Create the category
    const categoryId = await client.mutation(api.exercises.createCategory, {
      name: "Muscle Groups",
      description: "Primary muscle groups targeted by exercises",
      userId,
    })

    console.log("Created 'Muscle Groups' category")
    return categoryId
  } catch (error) {
    console.error("Error creating 'Muscle Groups' category:", error)
    return null
  }
}

async function insertCategoryValues(
  client: ConvexHttpClient,
  categoryId: Id<"categories">,
  muscleGroups: string[]
): Promise<{ id: Id<"categoryValues">; name: string }[]> {
  console.log("Inserting muscle group category values...")
  const insertedValues: { id: Id<"categoryValues">; name: string }[] = []

  const insertPromises = muscleGroups.map(async (name) => {
    try {
      const categoryValueId = await client.mutation(
        api.exercises.createCategoryValue,
        {
          categoryId,
          name,
          description: `${name} muscle group`,
        }
      )
      return { id: categoryValueId, name }
    } catch (error) {
      // If it already exists, we can safely skip
      if (error instanceof Error && error.message.includes("already exists")) {
        console.log(`Category value "${name}" already exists, skipping...`)
        return null
      }
      throw error
    }
  })

  const results = await Promise.all(insertPromises)
  for (const result of results) {
    if (result !== null) {
      insertedValues.push(result)
    }
  }

  console.log(
    `Inserted ${insertedValues.length} new muscle group values:`,
    insertedValues.map((v) => v.name)
  )
  return insertedValues
}

async function insertExercises(
  client: ConvexHttpClient,
  exercises: ExerciseWithCategoryAssignments[],
  ownerId?: Id<"users">
) {
  console.log("Inserting exercises...")

  const exercisesToInsert = exercises.map((exercise) => ({
    name: exercise.name,
    ownerId,
    categoryValueIds: exercise.categoryValueAssignmentIDs,
  }))

  const insertedExerciseIds = await client.mutation(
    api.exercises.bulkInsertExercises,
    {
      exercises: exercisesToInsert,
    }
  )

  console.log(`Inserted ${insertedExerciseIds.length} new exercises`)
}

async function seedExercises({
  userId,
  convexUrl,
}: {
  userId: Id<"users">
  convexUrl: string
}) {
  const client = new ConvexHttpClient(convexUrl)

  try {
    // Parse the exercises CSV file
    const exercisesFilePath = path.join(__dirname, "exercises.csv")
    const { exercises, muscleGroups } = parseExercisesCSV(exercisesFilePath)

    console.log(
      `Found ${exercises.length} exercises across ${muscleGroups.size} muscle groups`
    )

    // Step 1: Create the "Muscle Groups" category
    const categoryId = await createMuscleGroupCategory(client, userId)
    if (!categoryId) {
      console.error("Failed to create or find 'Muscle Groups' category")
      process.exit(1)
    }

    // Step 2: Insert muscle group category values
    await insertCategoryValues(client, categoryId, Array.from(muscleGroups))

    // Step 3: Get all category values (including already existing ones)
    const allCategories = await client.query(
      api.exercises.getCategoriesWithValues,
      {
        userId,
      }
    )
    const muscleGroupCategory = allCategories.find(
      (cat) => cat._id === categoryId
    )

    if (!muscleGroupCategory) {
      console.error("Failed to find muscle group category")
      process.exit(1)
    }

    // Map exercises to their category value IDs
    const exerciseWithIDs: ExerciseWithCategoryAssignments[] = exercises.map(
      (exercise) => ({
        name: exercise.name,
        categoryValueAssignmentIDs: muscleGroupCategory.values
          .filter((cv) => exercise.muscleGroups.includes(cv.name))
          .map((cv) => cv._id),
      })
    )

    // Step 4: Insert exercises and create category assignments
    await insertExercises(client, exerciseWithIDs, userId)

    console.log("✅ Successfully seeded exercises with categories!")
  } catch (error) {
    console.error("❌ Error seeding exercises:", error)
    process.exit(1)
  }
}

export { seedExercises, parseExercisesCSV }
