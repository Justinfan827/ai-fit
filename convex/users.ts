import type { UserJSON } from "@clerk/backend"
import { type Validator, v } from "convex/values"
import { v4 as uuidv4 } from "uuid"
import { internalMutation, type QueryCtx, query } from "./_generated/server"
import { throwIfNotAuthenticated } from "./auth"

const getAllByTrainerId = query({
  handler: async (ctx) => {
    const user = await throwIfNotAuthenticated(ctx)
    const clients = await ctx.db
      .query("users")
      .withIndex("byTrainerId", (q) => q.eq("trainerId", user.id))
      .collect()

    return clients.map((client) => ({
      id: client._id,
      avatarURL: client.avatarURL || "",
      email: client.email,
      firstName: client.firstName,
      lastName: client.lastName,
      createdAt: client.createdAt,
    }))
  },
})

const getCurrentUser = query({
  handler: async (ctx) => {
    const user = await throwIfNotAuthenticated(ctx)
    return user
  },
})

const getById = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx) => {
    const user = await throwIfNotAuthenticated(ctx)
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: "trainer",
      avatarURL: user.avatarURL || "",
    } as {
      id: string
      email: string
      firstName: string
      lastName: string
      role: "trainer"
      avatarURL: string
    }
  },
})

const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> },
  async handler(ctx, { data }) {
    const user = await unauthedGetByExternalId(ctx, data.id)
    if (user === null) {
      await ctx.db.insert("users", {
        id: uuidv4(),
        // ISO8601 date string of current UTC time
        createdAt: new Date().toISOString(),
        externalId: data.id,
        trainerId: "",
        email: data.email_addresses[0]?.email_address || "",
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        avatarURL: data.image_url || "",
      })
    } else {
      await ctx.db.patch(user._id, {
        email: data.email_addresses[0]?.email_address || "",
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        avatarURL: data.image_url || "",
        updatedAt: new Date().toISOString(),
      })
    }
  },
})

const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await unauthedGetByExternalId(ctx, clerkUserId)

    if (user !== null) {
      await ctx.db.delete(user._id)
    } else {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`
      )
    }
  },
})

async function unauthedGetByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query("users")
    .withIndex("byExternalId", (q) => q.eq("externalId", externalId))
    .unique()
}

export {
  // getters
  getAllByTrainerId,
  // get currently authenticated user
  getCurrentUser,
  // get user by id
  getById,
  // for clerk webhooks
  upsertFromClerk,
  deleteFromClerk,
}
