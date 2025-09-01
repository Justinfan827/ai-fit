"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/create-server-client"
import type { DBClient } from "@/lib/supabase/types"
import type { Maybe } from "@/lib/types/types"
import { withAuthInput } from "./middleware/with-auth"

// Base schemas for common fields
const baseCategoryFields = {
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
}

const baseValueFields = {
  name: z.string().min(1, "Value name is required"),
  description: z.string().optional(),
}

// Discriminated union for category value operations
const categoryValueSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("create"),
    tempId: z.string(), // Temporary ID for new items
    ...baseValueFields,
  }),
  z.object({
    operation: z.literal("update"),
    id: z.string(),
    ...baseValueFields,
  }),
  z.object({
    operation: z.literal("delete"),
    id: z.string(),
  }),
])

// Discriminated union for category operations
const categorySchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("create"),
    tempId: z.string(), // Temporary ID for new items
    ...baseCategoryFields,
    values: z.array(categoryValueSchema),
  }),
  z.object({
    operation: z.literal("update"),
    id: z.string(),
    ...baseCategoryFields,
    values: z.array(categoryValueSchema),
  }),
  z.object({
    operation: z.literal("delete"),
    id: z.string(),
  }),
])

const manageCategoriesSchema = z.object({
  categories: z.array(categorySchema),
})

export type ManageCategoriesInput = z.infer<typeof manageCategoriesSchema>
export type CategoryOperation = z.infer<typeof categorySchema>
export type ValueOperation = z.infer<typeof categoryValueSchema>

async function createCategory(
  supabase: DBClient,
  category: { name: string; description?: string },
  userId: string
) {
  const { data: newCategory, error } = await supabase
    .from("categories")
    .insert({
      name: category.name,
      description: category.description || null,
      user_id: userId,
    })
    .select("id")
    .single()

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`)
  }
  return newCategory.id
}

async function updateCategory(
  supabase: DBClient,
  categoryId: string,
  category: { name: string; description?: string },
  userId: string
) {
  const { error } = await supabase
    .from("categories")
    .update({
      name: category.name,
      description: category.description || null,
    })
    .eq("id", categoryId)
    .eq("user_id", userId)

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`)
  }
}

async function deleteValue(supabase: DBClient, valueId: string) {
  const { error } = await supabase
    .from("category_values")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", valueId)

  if (error) {
    throw new Error(`Failed to delete value: ${error.message}`)
  }
}

async function createValue(
  supabase: DBClient,
  value: { name: string; description?: string },
  categoryId: string
) {
  const { error } = await supabase.from("category_values").insert({
    category_id: categoryId,
    name: value.name,
    description: value.description || null,
  })

  if (error) {
    throw new Error(`Failed to create value: ${error.message}`)
  }
}

async function updateValue(
  supabase: DBClient,
  valueId: string,
  value: { name: string; description?: string }
) {
  const { error } = await supabase
    .from("category_values")
    .update({
      name: value.name,
      description: value.description || null,
    })
    .eq("id", valueId)

  if (error) {
    throw new Error(`Failed to update value: ${error.message}`)
  }
}

async function deleteCategory(
  supabase: DBClient,
  categoryId: string,
  userId: string
) {
  const { error } = await supabase
    .from("categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", categoryId)
    .eq("user_id", userId)

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`)
  }
}

async function processValue(
  supabase: DBClient,
  value: ValueOperation,
  categoryId: string
) {
  switch (value.operation) {
    case "create":
      await createValue(supabase, value, categoryId)
      break
    case "update":
      await updateValue(supabase, value.id, value)
      break
    case "delete":
      await deleteValue(supabase, value.id)
      break
    default:
      throw new Error(
        `Unknown value operation: ${(value as { operation: string }).operation}`
      )
  }
}

async function processCategory(
  supabase: DBClient,
  category: CategoryOperation,
  userId: string
) {
  switch (category.operation) {
    case "delete":
      await deleteCategory(supabase, category.id, userId)
      break

    case "create": {
      const categoryId = await createCategory(supabase, category, userId)
      // Process all values for the newly created category
      await Promise.all(
        category.values.map((value) =>
          processValue(supabase, value, categoryId)
        )
      )
      break
    }

    case "update":
      await updateCategory(supabase, category.id, category, userId)
      // Process all values for the updated category
      await Promise.all(
        category.values.map((value) =>
          processValue(supabase, value, category.id)
        )
      )
      break

    default:
      throw new Error(
        `Unknown category operation: ${(category as { operation: string }).operation}`
      )
  }
}

export const manageCategoriesAction = withAuthInput(
  {
    schema: manageCategoriesSchema,
  },
  async ({ input, user }): Promise<Maybe<{ success: boolean }>> => {
    const supabase = await createServerClient()

    await Promise.all(
      input.categories.map((category) =>
        processCategory(supabase, category, user.userId)
      )
    )

    revalidatePath("/home/settings/exercises/categories")
    return { data: { success: true }, error: null }
  }
)
