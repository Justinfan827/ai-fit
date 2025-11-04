import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import { throwIfNotAuthenticated } from "./auth"

const getByTrainerAndClient = query({
  args: {
    clientId: v.string(),
  },
  handler: async (ctx, { clientId }) => {
    const trainer = await throwIfNotAuthenticated(ctx)

    // Convert string ID to Convex ID
    const clientIdAsId = clientId as Id<"users">
    const client = await ctx.db.get(clientIdAsId)

    // Verify the client belongs to this trainer
    if (!client || client.trainerId !== trainer.id) {
      return []
    }

    // Fetch all notes for this trainer and client, excluding soft-deleted ones
    const notes = await ctx.db
      .query("trainerNotes")
      .withIndex("by_trainer_and_client", (q) =>
        q.eq("trainerId", trainer.id).eq("clientId", clientIdAsId)
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect()

    // Sort by createdAt descending (newest first)
    const sortedNotes = notes.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })

    return sortedNotes.map((note) => ({
      id: note._id,
      title: note.title,
      description: note.description,
    }))
  },
})

const create = mutation({
  args: {
    clientId: v.string(),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, { clientId, title, description }) => {
    const trainer = await throwIfNotAuthenticated(ctx)

    // Convert string ID to Convex ID
    const clientIdAsId = clientId as Id<"users">
    const client = await ctx.db.get(clientIdAsId)

    // Verify the client belongs to this trainer
    if (!client || client.trainerId !== trainer.id) {
      throw new Error("Client not found or access denied")
    }

    const now = new Date().toISOString()

    const noteId = await ctx.db.insert("trainerNotes", {
      trainerId: trainer.id,
      clientId: clientIdAsId,
      title,
      description,
      createdAt: now,
      updatedAt: now,
      deletedAt: undefined,
    })

    const note = await ctx.db.get(noteId)
    if (!note) {
      throw new Error("Failed to create trainer note")
    }

    return {
      id: note._id,
      title: note.title,
      description: note.description,
    }
  },
})

const softDelete = mutation({
  args: {
    noteId: v.string(),
    clientId: v.string(),
  },
  handler: async (ctx, { noteId, clientId }) => {
    const trainer = await throwIfNotAuthenticated(ctx)

    // Convert string IDs to Convex IDs
    const noteIdAsId = noteId as Id<"trainerNotes">
    const clientIdAsId = clientId as Id<"users">

    const note = await ctx.db.get(noteIdAsId)
    if (!note) {
      throw new Error("Trainer note not found")
    }

    // Verify the note belongs to this trainer and client
    if (note.trainerId !== trainer.id || note.clientId !== clientIdAsId) {
      throw new Error("Trainer note not found or access denied")
    }

    // Soft delete by setting deletedAt
    await ctx.db.patch(noteIdAsId, {
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  },
})

export { getByTrainerAndClient, create, softDelete }
