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
})
