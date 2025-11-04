import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import { throwIfNotAuthenticated } from "./auth"

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new category
 */
export const createCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    // Check if category already exists for this user (non-deleted)
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_user_id_and_name", (q) =>
        q.eq("userId", args.userId).eq("name", args.name)
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .first()

    if (existing) {
      throw new Error(`Category "${args.name}" already exists for this user`)
    }

    return await ctx.db.insert("categories", {
      name: args.name,
      description: args.description,
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
    })
  },
})

/**
 * Create a category value
 */
export const createCategoryValue = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("categoryValues"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    // Check if category value already exists (non-deleted)
    const existing = await ctx.db
      .query("categoryValues")
      .withIndex("by_category_id_and_name", (q) =>
        q.eq("categoryId", args.categoryId).eq("name", args.name)
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .first()

    if (existing) {
      throw new Error(
        `Category value "${args.name}" already exists in this category`
      )
    }

    return await ctx.db.insert("categoryValues", {
      categoryId: args.categoryId,
      name: args.name,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    })
  },
})

/**
 * Update a category
 */
export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId)

    if (!category) {
      throw new Error("Category not found")
    }

    if (category.userId !== args.userId) {
      throw new Error("Category not found or cannot be updated")
    }

    if (category.deletedAt) {
      throw new Error("Cannot update a deleted category")
    }

    const now = new Date().toISOString()

    // Check if another category with the same name exists (non-deleted)
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_user_id_and_name", (q) =>
        q.eq("userId", args.userId).eq("name", args.name)
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .first()

    if (existing && existing._id !== args.categoryId) {
      throw new Error(`Category "${args.name}" already exists for this user`)
    }

    await ctx.db.patch(args.categoryId, {
      name: args.name,
      description: args.description,
      updatedAt: now,
    })

    return null
  },
})

/**
 * Delete a category (soft delete)
 */
export const deleteCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId)

    if (!category) {
      throw new Error("Category not found")
    }

    if (category.userId !== args.userId) {
      throw new Error("Category not found or cannot be deleted")
    }

    if (category.deletedAt) {
      return null
    }

    const now = new Date().toISOString()

    // Soft delete the category
    await ctx.db.patch(args.categoryId, {
      deletedAt: now,
      updatedAt: now,
    })

    // Soft delete all values in this category
    const values = await ctx.db
      .query("categoryValues")
      .withIndex("by_category_id", (q) => q.eq("categoryId", args.categoryId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect()

    const deleteValuePromises = values.map(async (value) => {
      await ctx.db.patch(value._id, {
        deletedAt: now,
        updatedAt: now,
      })
    })

    await Promise.all(deleteValuePromises)

    return null
  },
})

/**
 * Update a category value
 */
export const updateCategoryValue = mutation({
  args: {
    categoryValueId: v.id("categoryValues"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const categoryValue = await ctx.db.get(args.categoryValueId)

    if (!categoryValue) {
      throw new Error("Category value not found")
    }

    if (categoryValue.deletedAt) {
      throw new Error("Cannot update a deleted category value")
    }

    const now = new Date().toISOString()

    // Check if another value with the same name exists in this category (non-deleted)
    const existing = await ctx.db
      .query("categoryValues")
      .withIndex("by_category_id_and_name", (q) =>
        q.eq("categoryId", categoryValue.categoryId).eq("name", args.name)
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .first()

    if (existing && existing._id !== args.categoryValueId) {
      throw new Error(
        `Category value "${args.name}" already exists in this category`
      )
    }

    await ctx.db.patch(args.categoryValueId, {
      name: args.name,
      description: args.description,
      updatedAt: now,
    })

    return null
  },
})

/**
 * Delete a category value (soft delete)
 */
export const deleteCategoryValue = mutation({
  args: {
    categoryValueId: v.id("categoryValues"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const categoryValue = await ctx.db.get(args.categoryValueId)

    if (!categoryValue) {
      throw new Error("Category value not found")
    }

    if (categoryValue.deletedAt) {
      return null
    }

    const now = new Date().toISOString()

    await ctx.db.patch(args.categoryValueId, {
      deletedAt: now,
      updatedAt: now,
    })

    return null
  },
})

/**
 * Create an exercise
 */
export const createExercise = mutation({
  args: {
    name: v.string(),
    ownerId: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
  },
  returns: v.id("exercises"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    return await ctx.db.insert("exercises", {
      name: args.name,
      ownerId: args.ownerId,
      notes: args.notes,
      videoUrl: args.videoUrl,
      createdAt: now,
    })
  },
})

/**
 * Create a category assignment
 */
export const createCategoryAssignment = mutation({
  args: {
    exerciseId: v.id("exercises"),
    categoryValueId: v.id("categoryValues"),
  },
  returns: v.id("categoryAssignments"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    // Check if assignment already exists
    const existing = await ctx.db
      .query("categoryAssignments")
      .withIndex("by_exercise_id_and_category_value_id", (q) =>
        q
          .eq("exerciseId", args.exerciseId)
          .eq("categoryValueId", args.categoryValueId)
      )
      .first()

    if (existing) {
      throw new Error("Category assignment already exists")
    }

    return await ctx.db.insert("categoryAssignments", {
      exerciseId: args.exerciseId,
      categoryValueId: args.categoryValueId,
      createdAt: now,
    })
  },
})

/**
 * Bulk insert exercises with category assignments (for seeding)
 */
export const bulkInsertExercises = mutation({
  args: {
    exercises: v.array(
      v.object({
        name: v.string(),
        ownerId: v.optional(v.id("users")),
        notes: v.optional(v.string()),
        videoUrl: v.optional(v.string()),
        categoryValueIds: v.array(v.id("categoryValues")),
      })
    ),
  },
  returns: v.array(v.id("exercises")),
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const insertedExerciseIds: Id<"exercises">[] = []

    const exerciseInserts = args.exercises.map(async (exercise) => {
      // Insert exercise
      const exerciseId = await ctx.db.insert("exercises", {
        name: exercise.name,
        ownerId: exercise.ownerId,
        notes: exercise.notes,
        videoUrl: exercise.videoUrl,
        createdAt: now,
      })

      // Create category assignments
      const assignmentInserts = exercise.categoryValueIds.map(
        async (categoryValueId) => {
          await ctx.db.insert("categoryAssignments", {
            exerciseId,
            categoryValueId,
            createdAt: now,
          })
        }
      )

      await Promise.all(assignmentInserts)

      return exerciseId
    })

    const results = await Promise.all(exerciseInserts)
    insertedExerciseIds.push(...results)

    return insertedExerciseIds
  },
})

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all exercises (with optional filtering by owner)
 */
export const listExercises = query({
  args: {
    ownerId: v.optional(v.id("users")),
  },
  returns: v.array(
    v.object({
      _id: v.id("exercises"),
      _creationTime: v.number(),
      name: v.string(),
      ownerId: v.optional(v.id("users")),
      notes: v.optional(v.string()),
      videoUrl: v.optional(v.string()),
      createdAt: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    if (args.ownerId) {
      return await ctx.db
        .query("exercises")
        .withIndex("by_owner_id", (q) => q.eq("ownerId", args.ownerId))
        .collect()
    }
    return await ctx.db.query("exercises").collect()
  },
})

/**
 * Get exercises by array of IDs
 */
export const getExercisesByIds = query({
  args: {
    exerciseIds: v.array(v.id("exercises")),
  },
  returns: v.array(
    v.object({
      _id: v.id("exercises"),
      _creationTime: v.number(),
      name: v.string(),
      ownerId: v.optional(v.id("users")),
      notes: v.optional(v.string()),
      videoUrl: v.optional(v.string()),
      createdAt: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const exercisePromises = args.exerciseIds.map(async (exerciseId) => {
      return await ctx.db.get(exerciseId)
    })

    const results = await Promise.all(exercisePromises)
    return results.filter((exercise) => exercise !== null)
  },
})

/**
 * Get all categories and their values for a user
 */
export const getCategoriesWithValues = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      userId: v.id("users"),
      createdAt: v.string(),
      updatedAt: v.string(),
      deletedAt: v.optional(v.string()),
      values: v.array(
        v.object({
          _id: v.id("categoryValues"),
          _creationTime: v.number(),
          categoryId: v.id("categories"),
          name: v.string(),
          description: v.optional(v.string()),
          createdAt: v.string(),
          updatedAt: v.string(),
          deletedAt: v.optional(v.string()),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    // Get all non-deleted categories for user
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect()

    // For each category, get its values
    const categoryPromises = categories.map(async (category) => {
      const values = await ctx.db
        .query("categoryValues")
        .withIndex("by_category_id", (q) => q.eq("categoryId", category._id))
        .filter((q) => q.eq(q.field("deletedAt"), undefined))
        .collect()

      return {
        ...category,
        values,
      }
    })

    return await Promise.all(categoryPromises)
  },
})

/**
 * Get all categories assigned to a specific exercise
 */
export const getExerciseCategories = query({
  args: {
    exerciseId: v.id("exercises"),
  },
  returns: v.array(
    v.object({
      categoryName: v.string(),
      categoryValueName: v.string(),
      categoryId: v.id("categories"),
      categoryValueId: v.id("categoryValues"),
    })
  ),
  handler: async (ctx, args) => {
    // Get all category assignments for this exercise
    const assignments = await ctx.db
      .query("categoryAssignments")
      .withIndex("by_exercise_id", (q) => q.eq("exerciseId", args.exerciseId))
      .collect()

    const assignmentPromises = assignments.map(async (assignment) => {
      const categoryValue = await ctx.db.get(assignment.categoryValueId)
      if (!categoryValue) return null

      const category = await ctx.db.get(categoryValue.categoryId)
      if (!category) return null

      return {
        categoryName: category.name,
        categoryValueName: categoryValue.name,
        categoryId: category._id,
        categoryValueId: categoryValue._id,
      }
    })

    const results = await Promise.all(assignmentPromises)
    return results.filter((result) => result !== null)
  },
})

/**
 * Get all exercises for a user, including platform exercises and user's custom exercises
 * Returns data in format: { base: Exercise[], custom: Exercise[] }
 */
export const getAllExercisesForUser = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    base: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        ownerId: v.union(v.string(), v.null()),
        videoURL: v.string(),
        description: v.string(),
        categories: v.array(
          v.object({
            id: v.string(),
            name: v.string(),
            values: v.array(
              v.object({
                id: v.string(),
                name: v.string(),
              })
            ),
          })
        ),
      })
    ),
    custom: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        ownerId: v.union(v.string(), v.null()),
        videoURL: v.string(),
        description: v.string(),
        categories: v.array(
          v.object({
            id: v.string(),
            name: v.string(),
            values: v.array(
              v.object({
                id: v.string(),
                name: v.string(),
              })
            ),
          })
        ),
      })
    ),
  }),
  handler: async (ctx, args) => {
    // Fetch platform exercises (no owner)
    const platformExercises = await ctx.db
      .query("exercises")
      .withIndex("by_owner_id")
      .filter((q) => q.eq(q.field("ownerId"), undefined))
      .collect()

    // Fetch user's custom exercises
    const customExercises = await ctx.db
      .query("exercises")
      .withIndex("by_owner_id", (q) => q.eq("ownerId", args.userId))
      .collect()

    // Helper to transform an exercise to include categories
    const transformExercise = async (exercise: {
      _id: Id<"exercises">
      name: string
      ownerId?: Id<"users">
      notes?: string
      videoUrl?: string
    }) => {
      // Get all category assignments for this exercise
      const assignments = await ctx.db
        .query("categoryAssignments")
        .withIndex("by_exercise_id", (q) => q.eq("exerciseId", exercise._id))
        .collect()

      // Group category values by category
      const categoriesMap = new Map<
        Id<"categories">,
        {
          id: string
          name: string
          values: Array<{ id: string; name: string }>
        }
      >()

      const assignmentPromises = assignments.map(async (assignment) => {
        const categoryValue = await ctx.db.get(assignment.categoryValueId)
        if (!categoryValue || categoryValue.deletedAt) return null

        const category = await ctx.db.get(categoryValue.categoryId)
        if (!category || category.deletedAt) return null

        if (!categoriesMap.has(category._id)) {
          categoriesMap.set(category._id, {
            id: category._id,
            name: category.name,
            values: [],
          })
        }

        const categoryData = categoriesMap.get(category._id)
        if (categoryData) {
          categoryData.values.push({
            id: categoryValue._id,
            name: categoryValue.name,
          })
        }

        return null
      })

      await Promise.all(assignmentPromises)

      return {
        id: exercise._id,
        name: exercise.name,
        ownerId: exercise.ownerId || null,
        videoURL: exercise.videoUrl || "",
        description: exercise.notes || "",
        categories: Array.from(categoriesMap.values()),
      }
    }

    // Transform both sets of exercises
    const basePromises = platformExercises.map(transformExercise)
    const customPromises = customExercises.map(transformExercise)

    const [base, custom] = await Promise.all([
      Promise.all(basePromises),
      Promise.all(customPromises),
    ])

    return { base, custom }
  },
})

/**
 * Update an exercise and its category assignments
 */
export const updateExercise = mutation({
  args: {
    exerciseId: v.id("exercises"),
    name: v.string(),
    notes: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    categoryValueIds: v.array(v.id("categoryValues")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Authenticate the user
    const user = await throwIfNotAuthenticated(ctx)

    // First, verify that the exercise belongs to this user
    const exercise = await ctx.db.get(args.exerciseId)

    if (!exercise) {
      throw new Error("Exercise not found")
    }

    // Only allow update of custom exercises (exercises with ownerId)
    if (!exercise.ownerId || exercise.ownerId !== user.id) {
      throw new Error("Exercise not found or cannot be updated")
    }

    const now = new Date().toISOString()

    // Update the exercise fields
    await ctx.db.patch(args.exerciseId, {
      name: args.name,
      notes: args.notes,
      videoUrl: args.videoUrl,
    })

    // Delete all existing category assignments for this exercise
    const existingAssignments = await ctx.db
      .query("categoryAssignments")
      .withIndex("by_exercise_id", (q) => q.eq("exerciseId", args.exerciseId))
      .collect()

    const deleteAssignmentPromises = existingAssignments.map(
      async (assignment) => {
        await ctx.db.delete(assignment._id)
      }
    )

    await Promise.all(deleteAssignmentPromises)

    // Create new category assignments
    const createAssignmentPromises = args.categoryValueIds.map(
      async (categoryValueId) => {
        // Check if assignment already exists (shouldn't after delete, but safety check)
        const existing = await ctx.db
          .query("categoryAssignments")
          .withIndex("by_exercise_id_and_category_value_id", (q) =>
            q
              .eq("exerciseId", args.exerciseId)
              .eq("categoryValueId", categoryValueId)
          )
          .first()

        if (!existing) {
          await ctx.db.insert("categoryAssignments", {
            exerciseId: args.exerciseId,
            categoryValueId,
            createdAt: now,
          })
        }
      }
    )

    await Promise.all(createAssignmentPromises)

    return null
  },
})

/**
 * Delete an exercise and its category assignments
 */
export const deleteExercise = mutation({
  args: {
    exerciseId: v.id("exercises"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Authenticate the user
    const user = await throwIfNotAuthenticated(ctx)

    // First, verify that the exercise belongs to this user
    const exercise = await ctx.db.get(args.exerciseId)

    if (!exercise) {
      throw new Error("Exercise not found")
    }

    // Only allow deletion of custom exercises (exercises with ownerId)
    if (!exercise.ownerId || exercise.ownerId !== user.id) {
      throw new Error("Exercise not found or cannot be deleted")
    }

    // Delete all category assignments for this exercise
    const assignments = await ctx.db
      .query("categoryAssignments")
      .withIndex("by_exercise_id", (q) => q.eq("exerciseId", args.exerciseId))
      .collect()

    const deleteAssignmentPromises = assignments.map(async (assignment) => {
      await ctx.db.delete(assignment._id)
    })

    await Promise.all(deleteAssignmentPromises)

    // Delete the exercise
    await ctx.db.delete(args.exerciseId)

    return null
  },
})
