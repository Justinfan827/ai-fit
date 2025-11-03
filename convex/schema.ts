import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    // DEPRECATED. DO NOT USE.
    id: v.optional(v.string()),
    // clerk user id
    externalId: v.optional(v.string()),
    // reference to another user that is this user's trainer
    trainerId: v.optional(v.union(v.id("users"), v.string())),
    // user's email
    email: v.string(),
    // user's first name
    firstName: v.string(),
    // user's last name
    lastName: v.string(),
    // user's avatar URL (from clerk)
    avatarURL: v.optional(v.string()),
    // user's age
    age: v.optional(v.number()),
    // user's gender
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    // user's height value (in cm or inches depending on unit)
    heightValue: v.optional(v.number()),
    // user's height unit
    heightUnit: v.optional(v.union(v.literal("cm"), v.literal("in"))),
    // user's weight value (in kg or lbs depending on unit)
    weightValue: v.optional(v.number()),
    // user's weight unit
    weightUnit: v.optional(v.union(v.literal("kg"), v.literal("lbs"))),
    // user's created at (ISO8601 date string of current UTC time)
    createdAt: v.string(),
    // user's updated at (ISO8601 date string of current UTC time)
    updatedAt: v.optional(v.string()),
  })
    .index("byExternalId", ["externalId"])
    .index("byTrainerId", ["trainerId"]),
  programs: defineTable({
    // reference to the user who owns this program
    userId: v.id("users"),
    // program name
    name: v.string(),
    // program type: "weekly" or "splits"
    type: v.union(v.literal("weekly"), v.literal("splits")),
    // program creation timestamp (ISO8601 date string)
    createdAt: v.string(),
    // whether this program is a template
    isTemplate: v.optional(v.boolean()),
    // reference to another program if this is based on a template
    templateId: v.optional(v.id("programs")),
  }).index("byUserId", ["userId"]),
  workouts: defineTable({
    // reference to the program this workout belongs to
    programId: v.id("programs"),
    // workout name
    name: v.string(),
    // workout blocks (JSONB equivalent - stores complex workout structure)
    blocks: v.any(),
    // order of this workout within the program
    programOrder: v.number(),
    // week number (only for weekly programs)
    week: v.optional(v.number()),
    // workout creation timestamp (ISO8601 date string)
    createdAt: v.string(),
    // reference to the user who owns this workout
    userId: v.id("users"),
  }).index("byProgramId", ["programId"]),
  exercises: defineTable({
    // exercise name
    name: v.string(),
    // reference to the user who created this custom exercise (optional for platform exercises)
    ownerId: v.optional(v.id("users")),
    // custom notes attached to the exercise
    notes: v.optional(v.string()),
    // video URL for the exercise
    videoUrl: v.optional(v.string()),
    // exercise creation timestamp (ISO8601 date string)
    createdAt: v.string(),
  }).index("by_owner_id", ["ownerId"]),
  categories: defineTable({
    // category name (e.g., "Muscle Groups")
    name: v.string(),
    // category description
    description: v.optional(v.string()),
    // reference to the user who created this category
    userId: v.id("users"),
    // category creation timestamp (ISO8601 date string)
    createdAt: v.string(),
    // category update timestamp (ISO8601 date string)
    updatedAt: v.string(),
    // soft delete timestamp (ISO8601 date string)
    deletedAt: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_id_and_name", ["userId", "name"]),
  categoryValues: defineTable({
    // reference to the parent category
    categoryId: v.id("categories"),
    // value name (e.g., "Chest", "Shoulders")
    name: v.string(),
    // value description
    description: v.optional(v.string()),
    // category value creation timestamp (ISO8601 date string)
    createdAt: v.string(),
    // category value update timestamp (ISO8601 date string)
    updatedAt: v.string(),
    // soft delete timestamp (ISO8601 date string)
    deletedAt: v.optional(v.string()),
  })
    .index("by_category_id", ["categoryId"])
    .index("by_category_id_and_name", ["categoryId", "name"]),
  categoryAssignments: defineTable({
    // reference to the exercise
    exerciseId: v.id("exercises"),
    // reference to the category value
    categoryValueId: v.id("categoryValues"),
    // assignment creation timestamp (ISO8601 date string)
    createdAt: v.string(),
  })
    .index("by_exercise_id", ["exerciseId"])
    .index("by_category_value_id", ["categoryValueId"])
    .index("by_exercise_id_and_category_value_id", [
      "exerciseId",
      "categoryValueId",
    ]),
})
