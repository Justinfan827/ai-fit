import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    // internal user id
    id: v.string(),
    // clerk user id
    externalId: v.string(),
    // reference to another user that is this user's trainer
    trainerId: v.string(),
    // user's email
    email: v.string(),
    // user's first name
    firstName: v.string(),
    // user's last name
    lastName: v.string(),
    // user's avatar URL (from clerk)
    avatarURL: v.optional(v.string()),
    // user's created at (ISO8601 date string of current UTC time)
    createdAt: v.string(),
    // user's updated at (ISO8601 date string of current UTC time)
    updatedAt: v.optional(v.string()),
  })
    .index("byExternalId", ["externalId"])
    .index("byTrainerId", ["trainerId"]),
})
