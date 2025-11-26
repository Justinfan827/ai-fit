import type { UserJSON } from "@clerk/backend"
import { type Validator, v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import {
  internalMutation,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server"
import { throwIfNotAuthenticated } from "./auth"

const getAllByTrainerId = query({
  handler: async (ctx) => {
    const user = await throwIfNotAuthenticated(ctx)
    const clients = await ctx.db
      .query("users")
      .withIndex("byTrainerId", (q) => q.eq("trainerId", user.id))
      .collect()

    // Fetch trainer notes for all clients in parallel
    const clientsWithNotes = await Promise.all(
      clients.map(async (client) => {
        const notes = await ctx.db
          .query("trainerNotes")
          .withIndex("by_trainer_and_client", (q) =>
            q.eq("trainerId", user.id).eq("clientId", client._id)
          )
          .filter((q) => q.eq(q.field("deletedAt"), undefined))
          .collect()

        // Sort by createdAt descending (newest first)
        const sortedNotes = notes.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime()
          const dateB = new Date(b.createdAt).getTime()
          return dateB - dateA
        })

        return {
          id: client._id,
          avatarURL: client.avatarURL || "",
          email: client.email,
          firstName: client.firstName,
          lastName: client.lastName,
          createdAt: client.createdAt,
          age: client.age ?? 0,
          gender: (client.gender ?? "male") as "male" | "female",
          weight: {
            value: client.weightValue ?? 0,
            unit: (client.weightUnit ?? "kg") as "kg" | "lbs",
          },
          height: {
            value: client.heightValue ?? 0,
            unit: (client.heightUnit ?? "cm") as "cm" | "in",
          },
          trainerNotes: sortedNotes.map((note) => ({
            id: note._id,
            title: note.title,
            description: note.description,
          })),
        }
      })
    )

    return clientsWithNotes
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

const getClientById = query({
  args: {
    clientId: v.string(),
  },
  handler: async (ctx, { clientId }) => {
    const trainer = await throwIfNotAuthenticated(ctx)

    // Convert string ID to Convex ID
    const clientIdAsId = clientId as Id<"users">
    const client = await ctx.db.get(clientIdAsId)

    if (!client || client.trainerId !== trainer.id) {
      return null
    }

    // Convert height value: if unit is "in", convert to total inches
    // Note: heightValue is stored as total inches when unit is "in"
    const heightValue = client.heightValue ?? 0
    const heightUnit = client.heightUnit ?? "cm"

    // Convert height value back to format expected by frontend
    // If unit is "in", we need to convert total inches back to feet/inches format
    // But the frontend expects { value: number, unit: "cm" | "in" }
    // Where value for "in" is total inches
    const height = {
      value: heightValue,
      unit: heightUnit as "cm" | "in",
    }

    const weight = {
      value: client.weightValue ?? 0,
      unit: (client.weightUnit ?? "kg") as "kg" | "lbs",
    }

    return {
      id: client._id,
      avatarURL: client.avatarURL || "",
      createdAt: client.createdAt,
      email: client.email,
      firstName: client.firstName,
      lastName: client.lastName,
      age: client.age ?? 0,
      gender: (client.gender ?? "male") as "male" | "female",
      height,
      weight,
      programs: [], // Programs not yet migrated to Convex
      trainerNotes: [], // Trainer notes not yet migrated to Convex
    }
  },
})

const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> },
  async handler(ctx, { data }) {
    const user = await unauthedGetByExternalId(ctx, data.id)
    if (user === null) {
      await ctx.db.insert("users", {
        // ISO8601 date string of current UTC time
        createdAt: new Date().toISOString(),
        externalId: data.id,
        trainerId: undefined,
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

const createClient = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    age: v.number(),
    gender: v.union(v.literal("male"), v.literal("female")),
    heightValue: v.number(),
    heightUnit: v.union(v.literal("cm"), v.literal("in")),
    weightValue: v.number(),
    weightUnit: v.union(v.literal("kg"), v.literal("lbs")),
  },
  handler: async (ctx, args) => {
    const trainer = await throwIfNotAuthenticated(ctx)

    const userId = await ctx.db.insert("users", {
      externalId: "",
      trainerId: trainer.id,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      avatarURL: "",
      age: args.age,
      gender: args.gender,
      heightValue: args.heightValue,
      heightUnit: args.heightUnit,
      weightValue: args.weightValue,
      weightUnit: args.weightUnit,
      createdAt: new Date().toISOString(),
    })

    const createdUser = await ctx.db.get(userId)
    if (!createdUser) {
      throw new Error("Failed to create client")
    }

    return {
      id: createdUser._id,
      avatarURL: createdUser.avatarURL || "",
      createdAt: createdUser.createdAt,
      email: createdUser.email,
      firstName: createdUser.firstName,
      lastName: createdUser.lastName,
    }
  },
})

const removeClientFromTrainer = mutation({
  args: {
    clientId: v.id("users"),
  },
  handler: async (ctx, { clientId }) => {
    const trainer = await throwIfNotAuthenticated(ctx)

    const client = await ctx.db.get(clientId)

    if (!client) {
      throw new Error("Client not found")
    }

    // Verify the client belongs to this trainer
    if (client.trainerId !== trainer.id) {
      throw new Error("Client not found or access denied")
    }

    // Remove the trainer association by setting trainerId to undefined
    await ctx.db.patch(clientId, {
      trainerId: undefined,
      updatedAt: new Date().toISOString(),
    })
  },
})

export {
  // getters
  getAllByTrainerId,
  // get currently authenticated user
  getCurrentUser,
  // get user by id
  getById,
  // get client by id
  getClientById,
  // create client
  createClient,
  // remove client from trainer
  removeClientFromTrainer,
  // for clerk webhooks
  upsertFromClerk,
  deleteFromClerk,
}
