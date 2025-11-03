"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Edit2, Plus, Save, Trash2, X } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import { z } from "zod"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { CategoryWithValues } from "@/lib/types/categories"
import { EmptyStateCard } from "../empty-state"

interface CategoryManagerProps {
  initialCategories: CategoryWithValues[]
  userId: Id<"users">
}

// Form schema for category editing
const categoryValueSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Value name is required"),
  description: z.string().optional(),
})

const categoryFormSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  values: z.array(categoryValueSchema),
})

const categoriesFormSchema = z.object({
  categories: z.array(categoryFormSchema),
})

type CategoryFormData = z.infer<typeof categoriesFormSchema>

// Simplified UI state - no operation tracking, just pure data
interface UICategory {
  id: string // Real ID for existing categories, tempId for new ones
  name: string
  description?: string
  values: UICategoryValue[]
}

interface UICategoryValue {
  id: string // Real ID for existing values, tempId for new ones
  name: string
  description?: string
}

type CategoryOperation =
  | {
      operation: "create"
      tempId: string
      name: string
      description?: string
      values: ValueOperation[]
    }
  | {
      operation: "update"
      id: string
      name: string
      description?: string
      values: ValueOperation[]
    }
  | {
      operation: "delete"
      id: string
    }

type ValueOperation =
  | {
      operation: "create"
      tempId: string
      name: string
      description?: string
    }
  | {
      operation: "update"
      id: string
      name: string
      description?: string
    }
  | {
      operation: "delete"
      id: string
    }

export function CategoryManager({
  initialCategories,
  userId,
}: CategoryManagerProps) {
  // Keep original state immutable for reference
  const [originalCategories] = useState<UICategory[]>(() =>
    initialCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || "",
      values: cat.values.map((val) => ({
        id: val.id,
        name: val.name,
        description: val.description || "",
      })),
    }))
  )

  const [isPending, setIsPending] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Convex mutations
  const createCategoryMutation = useMutation(api.exercises.createCategory)
  const updateCategoryMutation = useMutation(api.exercises.updateCategory)
  const deleteCategoryMutation = useMutation(api.exercises.deleteCategory)
  const createCategoryValueMutation = useMutation(
    api.exercises.createCategoryValue
  )
  const updateCategoryValueMutation = useMutation(
    api.exercises.updateCategoryValue
  )
  const deleteCategoryValueMutation = useMutation(
    api.exercises.deleteCategoryValue
  )

  // Initialize form with current categories
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoriesFormSchema),
    defaultValues: {
      categories: originalCategories,
    },
  })

  const categories = form.watch("categories")

  const handleAddCategory = () => {
    const tempId = uuidv4()
    const newCategory: UICategory = {
      id: tempId,
      name: "",
      description: "",
      values: [],
    }
    const currentCategories = form.getValues("categories")
    form.setValue("categories", [...currentCategories, newCategory])
    setIsEditing(true)
  }

  const handleEditCategory = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    // Reset form to original state
    form.reset({ categories: originalCategories })
    setIsEditing(false)
  }

  const handleDeleteCategory = (categoryId: string) => {
    const currentCategories = form.getValues("categories")
    form.setValue(
      "categories",
      currentCategories.filter((cat) => cat.id !== categoryId)
    )
  }

  const handleAddValue = (categoryId: string) => {
    const tempId = uuidv4()
    const newValue: UICategoryValue = {
      id: tempId,
      name: "",
      description: "",
    }

    const currentCategories = form.getValues("categories")
    const updatedCategories = currentCategories.map((cat) =>
      cat.id === categoryId
        ? { ...cat, values: [...cat.values, newValue] }
        : cat
    )
    form.setValue("categories", updatedCategories)
    setIsEditing(true)
  }

  const handleDeleteValue = (categoryId: string, valueId: string) => {
    const currentCategories = form.getValues("categories")
    const updatedCategories = currentCategories.map((cat) =>
      cat.id === categoryId
        ? {
            ...cat,
            values: cat.values.filter((val) => val.id !== valueId),
          }
        : cat
    )
    form.setValue("categories", updatedCategories)
  }

  const handleSaveChanges = form.handleSubmit(async (data) => {
    setIsPending(true)
    try {
      // Temporarily set categories from form data for diff calculation
      const formCategories = data.categories
      const operations = createDiffWithData(formCategories)

      if (operations.length === 0) {
        toast.success("No changes to save")
        setIsEditing(false)
        setIsPending(false)
        return
      }

      // Process operations sequentially
      // First, handle deletes (in reverse order to avoid issues)
      for (const operation of operations) {
        if (operation.operation === "delete") {
          await deleteCategoryMutation({
            categoryId: operation.id as Id<"categories">,
            userId,
          })
        }
      }

      // Then, handle creates (create categories first, then values)
      for (const operation of operations) {
        if (operation.operation === "create") {
          const categoryId = await createCategoryMutation({
            name: operation.name,
            description: operation.description,
            userId,
          })

          // Create values for this category
          for (const valueOp of operation.values) {
            if (valueOp.operation === "create") {
              await createCategoryValueMutation({
                categoryId,
                name: valueOp.name,
                description: valueOp.description,
              })
            }
          }
        }
      }

      // Finally, handle updates (update categories, then process values)
      for (const operation of operations) {
        if (operation.operation === "update") {
          // Update category
          await updateCategoryMutation({
            categoryId: operation.id as Id<"categories">,
            name: operation.name,
            description: operation.description,
            userId,
          })

          // Process values for this category
          for (const valueOp of operation.values) {
            if (valueOp.operation === "create") {
              await createCategoryValueMutation({
                categoryId: operation.id as Id<"categories">,
                name: valueOp.name,
                description: valueOp.description,
              })
            } else if (valueOp.operation === "update") {
              await updateCategoryValueMutation({
                categoryValueId: valueOp.id as Id<"categoryValues">,
                name: valueOp.name,
                description: valueOp.description,
              })
            } else if (valueOp.operation === "delete") {
              await deleteCategoryValueMutation({
                categoryValueId: valueOp.id as Id<"categoryValues">,
              })
            }
          }
        }
      }

      toast.success("Categories saved successfully")
      setIsEditing(false)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save categories"
      )
    } finally {
      setIsPending(false)
    }
  })

  // Helper functions to break down complex diff logic
  const getDeletedCategories = (
    formCategories: UICategory[]
  ): CategoryOperation[] => {
    return originalCategories
      .filter((original) => !formCategories.some((c) => c.id === original.id))
      .map((original) => ({
        operation: "delete" as const,
        id: original.id,
      }))
  }

  const getValueOperations = (
    original: UICategory,
    current: UICategory
  ): ValueOperation[] => {
    const deletedValues: ValueOperation[] = original.values
      .filter(
        (originalVal) => !current.values.some((v) => v.id === originalVal.id)
      )
      .map((originalVal) => ({
        operation: "delete" as const,
        id: originalVal.id,
      }))

    const changedValues: ValueOperation[] = []
    for (const currentVal of current.values) {
      const originalVal = original.values.find((v) => v.id === currentVal.id)

      if (originalVal) {
        // Check if value changed
        const valueChanged =
          currentVal.name !== originalVal.name ||
          currentVal.description !== originalVal.description

        if (valueChanged) {
          changedValues.push({
            operation: "update" as const,
            id: currentVal.id,
            name: currentVal.name,
            description: currentVal.description,
          })
        }
      } else {
        // New value
        changedValues.push({
          operation: "create" as const,
          tempId: currentVal.id,
          name: currentVal.name,
          description: currentVal.description,
        })
      }
    }

    return [...deletedValues, ...changedValues]
  }

  const getUpdatedCategories = (
    formCategories: UICategory[]
  ): CategoryOperation[] => {
    const updatedCategories: CategoryOperation[] = []

    for (const current of formCategories) {
      const original = originalCategories.find((c) => c.id === current.id)

      if (original) {
        // Existing category - check for changes
        const categoryChanged =
          current.name !== original.name ||
          current.description !== original.description

        const valueOperations = getValueOperations(original, current)

        // Add category update if category or values changed
        if (categoryChanged || valueOperations.length > 0) {
          updatedCategories.push({
            operation: "update" as const,
            id: current.id,
            name: current.name,
            description: current.description,
            values: valueOperations,
          })
        }
      } else {
        // New category (has temp ID)
        updatedCategories.push({
          operation: "create" as const,
          tempId: current.id,
          name: current.name,
          description: current.description,
          values: current.values.map(
            (val): ValueOperation => ({
              operation: "create" as const,
              tempId: val.id,
              name: val.name,
              description: val.description,
            })
          ),
        })
      }
    }

    return updatedCategories
  }

  // Helper function to create diff with specific data
  const createDiffWithData = (
    formCategories: UICategory[]
  ): CategoryOperation[] => {
    return [
      ...getDeletedCategories(formCategories),
      ...getUpdatedCategories(formCategories),
    ]
  }

  const hasChanges = isEditing && createDiffWithData(categories).length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl tracking-tight">
            Exercise Categories
          </h2>
          <p className="text-muted-foreground">
            Manage your custom exercise categories and their values
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <Button onClick={handleEditCategory} variant="outline">
              <Edit2 className="h-4 w-4" />
              Edit Categories
            </Button>
          )}
          {hasChanges && (
            <>
              <Button
                disabled={isPending}
                onClick={handleCancelEdit}
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isPending} onClick={handleSaveChanges}>
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <Form {...form}>
        <div className="space-y-4">
          {categories.map((category, categoryIndex) => (
            <Card className="relative" key={category.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name={`categories.${categoryIndex}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category Name</FormLabel>
                              <FormControl>
                                <Input
                                  className="font-semibold"
                                  placeholder="Category name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`categories.${categoryIndex}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Description (optional)"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : (
                      <div>
                        <CardTitle className="text-lg">
                          {category.name}
                        </CardTitle>
                        {category.description && (
                          <p className="mt-1 text-muted-foreground text-sm">
                            {category.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing && (
                      <Button
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteCategory(category.id)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Values</h4>
                    {isEditing && (
                      <Button
                        onClick={() => handleAddValue(category.id)}
                        size="sm"
                        variant="ghost"
                      >
                        <Plus className="h-3 w-3" />
                        Add Value
                      </Button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      {category.values.map((value, valueIndex) => (
                        <div className="flex items-center gap-2" key={value.id}>
                          <FormField
                            control={form.control}
                            name={`categories.${categoryIndex}.values.${valueIndex}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input placeholder="Value name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            onClick={() =>
                              handleDeleteValue(category.id, value.id)
                            }
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {category.values.length === 0 && (
                        <p className="text-muted-foreground text-sm">
                          No values yet
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {category.values.map((value) => (
                        <Badge key={value.id} variant="secondary">
                          {value.name}
                        </Badge>
                      ))}
                      {category.values.length === 0 && (
                        <p className="text-muted-foreground text-sm">
                          No values yet
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {isEditing && categories.length !== 0 && (
            <Button onClick={handleAddCategory} variant="outline">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          )}
          {categories.length === 0 && (
            <EmptyStateCard
              buttonAction={handleAddCategory}
              buttonText="Add Category"
              subtitle="Add your own custom categories to organize your exercises"
              title="No categories created yet"
            />
          )}
        </div>
      </Form>
    </div>
  )
}
