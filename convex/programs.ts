import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import { throwIfNotAuthenticated } from "./auth"

const getAll = query({
  args: {
    clientId: v.optional(v.id("users")),
  },
  handler: async (ctx, { clientId }) => {
    const user = await throwIfNotAuthenticated(ctx)

    // Determine which userId to query
    let targetUserId: Id<"users">
    if (clientId) {
      // Verify the client belongs to the authenticated trainer
      const client = await ctx.db.get(clientId)
      if (!client || client.trainerId !== user.id) {
        throw new Error("Unauthorized: Client not found or access denied")
      }
      targetUserId = clientId
    } else {
      // Default behavior: get programs for the authenticated trainer
      targetUserId = user.id
    }

    // Get all programs for the target user
    const programs = await ctx.db
      .query("programs")
      .withIndex("byUserId", (q) => q.eq("userId", targetUserId))
      .collect()

    // Sort programs by createdAt descending
    programs.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Get workouts for each program
    const programsWithWorkouts = await Promise.all(
      programs.map(async (program) => {
        const workouts = await ctx.db
          .query("workouts")
          .withIndex("byProgramId", (q) => q.eq("programId", program._id))
          .collect()

        // Sort workouts by programOrder
        workouts.sort((a, b) => a.programOrder - b.programOrder)

        return {
          id: program._id,
          created_at: program.createdAt,
          name: program.name,
          type: program.type as "weekly" | "splits",
          workouts: workouts.map((workout) => ({
            id: workout._id,
            program_order: workout.programOrder,
            program_id: workout.programId,
            name: workout.name,
            blocks: workout.blocks,
            week: workout.week,
          })),
        }
      })
    )

    return programsWithWorkouts
  },
})

const getById = query({
  args: {
    programId: v.id("programs"),
  },
  handler: async (ctx, { programId }) => {
    const user = await throwIfNotAuthenticated(ctx)

    const program = await ctx.db.get(programId)

    if (!program) {
      return null
    }

    // Validate ownership
    if (program.userId !== user.id) {
      return null
    }

    // Get workouts for this program
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("byProgramId", (q) => q.eq("programId", programId))
      .collect()

    // Sort workouts by programOrder
    workouts.sort((a, b) => a.programOrder - b.programOrder)

    return {
      id: program._id,
      created_at: program.createdAt,
      name: program.name,
      type: program.type as "weekly" | "splits",
      workouts: workouts.map((workout) => ({
        id: workout._id,
        program_order: workout.programOrder,
        program_id: workout.programId,
        name: workout.name,
        blocks: workout.blocks,
        week: workout.week,
      })),
    }
  },
})

const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("weekly"), v.literal("splits")),
    workouts: v.array(
      v.object({
        name: v.string(),
        blocks: v.any(),
        programOrder: v.number(),
        week: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { name, type, workouts }) => {
    const user = await throwIfNotAuthenticated(ctx)

    const createdAt = new Date().toISOString()

    // Create the program
    const programId = await ctx.db.insert("programs", {
      userId: user.id,
      name,
      type,
      createdAt,
      isTemplate: true,
    })

    // If workouts array is empty, seed with default workouts from user's exercises
    let workoutsToCreate = workouts
    if (workouts.length === 0) {
      // Fetch platform exercises (no owner)
      const platformExercises = await ctx.db
        .query("exercises")
        .withIndex("by_owner_id")
        .filter((q) => q.eq(q.field("ownerId"), undefined))
        .collect()

      // Fetch user's custom exercises
      const customExercises = await ctx.db
        .query("exercises")
        .withIndex("by_owner_id", (q) => q.eq("ownerId", user.id))
        .collect()

      // Combine and take first couple of exercises
      const allExercises = [...platformExercises, ...customExercises].slice(
        0,
        3
      )

      // Create 1 sample workout.
      const defaultWorkoutNames = ["Sample Workout"]
      workoutsToCreate = []
      if (allExercises.length === 0) {
        // If no exercises, create at least one empty workout
        workoutsToCreate.push({
          name: defaultWorkoutNames[0],
          blocks: [],
          programOrder: 0,
          week: undefined,
        })
      } else {
        const blocks = allExercises.map((exercise) => ({
          type: "exercise" as const,
          exercise: {
            id: exercise._id,
            name: exercise.name,
            metadata: {
              sets: "3",
              reps: "10",
              weight: "BW",
              rest: "60s",
            },
          },
        }))

        workoutsToCreate.push({
          name: defaultWorkoutNames[0],
          blocks,
          programOrder: 0,
          week: undefined,
        })
      }
    }

    // Create workouts
    const workoutIds = await Promise.all(
      workoutsToCreate.map((workout) =>
        ctx.db.insert("workouts", {
          programId,
          name: workout.name,
          blocks: workout.blocks,
          programOrder: workout.programOrder,
          week: workout.week,
          createdAt,
          userId: user.id,
        })
      )
    )

    // Fetch the created program and workouts to return
    const program = await ctx.db.get(programId)
    if (!program) {
      throw new Error("Failed to create program")
    }

    const createdWorkouts = await Promise.all(
      workoutIds.map((id) => ctx.db.get(id))
    )

    const validWorkouts = createdWorkouts.filter(
      (w): w is NonNullable<typeof w> => w !== null
    )

    return {
      id: program._id,
      created_at: program.createdAt,
      name: program.name,
      type: program.type as "weekly" | "splits",
      workouts: validWorkouts.map((workout) => ({
        id: workout._id,
        program_order: workout.programOrder,
        program_id: workout.programId,
        name: workout.name,
        blocks: workout.blocks,
        week: workout.week,
      })),
    }
  },
})

const update = mutation({
  args: {
    programId: v.id("programs"),
    name: v.string(),
    workouts: v.array(
      v.object({
        name: v.string(),
        blocks: v.any(),
        programOrder: v.number(),
        week: v.optional(v.number()),
      })
    ),
  },
  returns: v.union(
    v.object({
      id: v.string(),
      created_at: v.string(),
      name: v.string(),
      type: v.union(v.literal("weekly"), v.literal("splits")),
      workouts: v.array(
        v.object({
          id: v.string(),
          program_order: v.number(),
          program_id: v.string(),
          name: v.string(),
          blocks: v.any(),
          week: v.optional(v.number()),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, { programId, name, workouts }) => {
    const user = await throwIfNotAuthenticated(ctx)

    const program = await ctx.db.get(programId)

    if (!program) {
      return null
    }

    // Validate ownership
    if (program.userId !== user.id) {
      throw new Error("Unauthorized")
    }

    // Update program name
    await ctx.db.patch(programId, {
      name,
    })

    // Delete existing workouts for this program
    const existingWorkouts = await ctx.db
      .query("workouts")
      .withIndex("byProgramId", (q) => q.eq("programId", programId))
      .collect()

    await Promise.all(
      existingWorkouts.map((workout) => ctx.db.delete(workout._id))
    )

    // Insert new workouts
    const createdAt = new Date().toISOString()
    const workoutIds = await Promise.all(
      workouts.map((workout) =>
        ctx.db.insert("workouts", {
          programId,
          name: workout.name,
          blocks: workout.blocks,
          programOrder: workout.programOrder,
          week: workout.week,
          createdAt,
          userId: user.id,
        })
      )
    )

    // Fetch the updated program and workouts to return
    const updatedProgram = await ctx.db.get(programId)
    if (!updatedProgram) {
      throw new Error("Failed to update program")
    }

    const createdWorkouts = await Promise.all(
      workoutIds.map((id) => ctx.db.get(id))
    )

    const validWorkouts = createdWorkouts.filter(
      (w): w is NonNullable<typeof w> => w !== null
    )

    // Sort workouts by programOrder
    validWorkouts.sort((a, b) => a.programOrder - b.programOrder)

    return {
      id: updatedProgram._id,
      created_at: updatedProgram.createdAt,
      name: updatedProgram.name,
      type: updatedProgram.type as "weekly" | "splits",
      workouts: validWorkouts.map((workout) => ({
        id: workout._id,
        program_order: workout.programOrder,
        program_id: workout.programId,
        name: workout.name,
        blocks: workout.blocks,
        week: workout.week,
      })),
    }
  },
})

const deleteProgram = mutation({
  args: {
    programId: v.id("programs"),
  },
  handler: async (ctx, { programId }) => {
    const user = await throwIfNotAuthenticated(ctx)

    const program = await ctx.db.get(programId)

    if (!program) {
      throw new Error("Program not found")
    }

    // Validate ownership
    if (program.userId !== user.id) {
      throw new Error("Unauthorized")
    }

    // Delete the program (workouts will be cascade deleted)
    await ctx.db.delete(programId)
  },
})

export { create, deleteProgram, getAll, getById, update }
