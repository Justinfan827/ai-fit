"use client"

import { Edit2, Plus, Save, Trash2, X } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  type CategoryOperation,
  manageCategoriesAction,
  type ValueOperation,
} from "@/actions/manage-categories"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { CategoryWithValues } from "@/lib/types/categories"
import { EmptyStateCard } from "../empty-state"

interface CategoryManagerProps {
  initialCategories: CategoryWithValues[]
}

// Simplified UI state - no operation tracking, just pure data
interface UICategory {
  id: string // Real ID for existing categories, tempId for new ones
  name: string
  description?: string
  isEditing?: boolean
  values: UICategoryValue[]
}

interface UICategoryValue {
  id: string // Real ID for existing values, tempId for new ones
  name: string
  description?: string
  isEditing?: boolean
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  // Keep original state immutable for reference
  const [originalCategories] = useState<UICategory[]>(() =>
    initialCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || "",
      isEditing: false,
      values: cat.values.map((val) => ({
        id: val.id,
        name: val.name,
        description: val.description || "",
        isEditing: false,
      })),
    }))
  )

  // Current editing state
  const [categories, setCategories] = useState<UICategory[]>(() => [
    ...originalCategories,
  ])

  const [isPending, startTransition] = useTransition()

  const generateTempId = () => `temp_${Date.now()}_${Math.random()}`

  // Helper functions to break down complex diff logic
  const findDeletedCategories = (): CategoryOperation[] => {
    return originalCategories
      .filter((original) => !categories.some((c) => c.id === original.id))
      .map((original) => ({
        operation: "delete" as const,
        id: original.id,
      }))
  }

  const findDeletedValues = (
    original: UICategory,
    current: UICategory
  ): ValueOperation[] => {
    return original.values
      .filter(
        (originalVal) => !current.values.some((v) => v.id === originalVal.id)
      )
      .map((originalVal) => ({
        operation: "delete" as const,
        id: originalVal.id,
      }))
  }

  const findCreatedAndUpdatedValues = (
    original: UICategory,
    current: UICategory
  ): ValueOperation[] => {
    const operations: ValueOperation[] = []

    for (const currentVal of current.values) {
      const originalVal = original.values.find((v) => v.id === currentVal.id)

      if (originalVal) {
        // Check if value changed
        const valueChanged =
          currentVal.name !== originalVal.name ||
          currentVal.description !== originalVal.description

        if (valueChanged) {
          operations.push({
            operation: "update" as const,
            id: currentVal.id,
            name: currentVal.name,
            description: currentVal.description,
          })
        }
      } else {
        // New value
        operations.push({
          operation: "create" as const,
          tempId: currentVal.id,
          name: currentVal.name,
          description: currentVal.description,
        })
      }
    }

    return operations
  }

  const findCreatedAndUpdatedCategories = (): CategoryOperation[] => {
    const operations: CategoryOperation[] = []

    for (const current of categories) {
      const original = originalCategories.find((c) => c.id === current.id)

      if (original) {
        // Existing category - check for changes
        const categoryChanged =
          current.name !== original.name ||
          current.description !== original.description

        // Check for value changes
        const deletedValues = findDeletedValues(original, current)
        const changedValues = findCreatedAndUpdatedValues(original, current)
        const valueOperations = [...deletedValues, ...changedValues]

        // Add category update if category or values changed
        if (categoryChanged || valueOperations.length > 0) {
          operations.push({
            operation: "update" as const,
            id: current.id,
            name: current.name,
            description: current.description,
            values: valueOperations,
          })
        }
      } else {
        // New category (has temp ID)
        operations.push({
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

    return operations
  }

  // Create diff between original and current state to determine operations
  const createDiff = (): CategoryOperation[] => {
    return [...findDeletedCategories(), ...findCreatedAndUpdatedCategories()]
  }

  const handleAddCategory = () => {
    const tempId = generateTempId()
    const newCategory: UICategory = {
      id: tempId,
      name: "",
      description: "",
      isEditing: true,
      values: [],
    }
    setCategories((prev) => [...prev, newCategory])
  }

  const handleEditCategory = (categoryId: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, isEditing: true } : cat
      )
    )
  }

  const handleCancelEdit = () => {
    // Reset to original state
    setCategories([...originalCategories])
  }

  const handleUpdateCategory = (
    categoryId: string,
    field: "name" | "description",
    value: string
  ) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, [field]: value } : cat
      )
    )
  }

  const handleDeleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
  }

  const handleAddValue = (categoryId: string) => {
    const tempId = generateTempId()
    const newValue: UICategoryValue = {
      id: tempId,
      name: "",
      description: "",
      isEditing: true,
    }

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, values: [...cat.values, newValue] }
          : cat
      )
    )
  }

  const handleEditValue = (categoryId: string, valueId: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              values: cat.values.map((val) =>
                val.id === valueId ? { ...val, isEditing: true } : val
              ),
            }
          : cat
      )
    )
  }

  const handleUpdateValue = (
    categoryId: string,
    valueId: string,
    field: "name" | "description",
    value: string
  ) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              values: cat.values.map((val) =>
                val.id === valueId ? { ...val, [field]: value } : val
              ),
            }
          : cat
      )
    )
  }

  const handleDeleteValue = (categoryId: string, valueId: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              values: cat.values.filter((val) => val.id !== valueId),
            }
          : cat
      )
    )
  }

  const handleSaveChanges = () => {
    startTransition(async () => {
      try {
        const operations = createDiff()

        if (operations.length === 0) {
          toast.success("No changes to save")
          return
        }

        const result = await manageCategoriesAction({
          categories: operations,
        })

        if (result.error) {
          throw new Error(result.error.message)
        }

        // On success, refresh the page or update state
        // For simplicity, we'll refresh to get the updated data from the server
        window.location.reload()

        toast.success("Categories saved successfully")
      } catch {
        toast.error("Failed to save categories")
      }
    })
  }

  const hasChanges = createDiff().length > 0

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

      <div className="space-y-4">
        {categories.map((category) => (
          <Card className="relative" key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {category.isEditing ? (
                    <div className="space-y-2">
                      <Input
                        className="font-semibold"
                        onChange={(e) =>
                          handleUpdateCategory(
                            category.id,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="Category name"
                        value={category.name}
                      />
                      <Input
                        onChange={(e) =>
                          handleUpdateCategory(
                            category.id,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Description (optional)"
                        value={category.description}
                      />
                    </div>
                  ) : (
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      {category.description && (
                        <p className="mt-1 text-muted-foreground text-sm">
                          {category.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!category.isEditing && (
                    <Button
                      onClick={() => handleEditCategory(category.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCategory(category.id)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Values</h4>
                  <Button
                    onClick={() => handleAddValue(category.id)}
                    size="sm"
                    variant="ghost"
                  >
                    <Plus className="h-3 w-3" />
                    Add Value
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {category.values.map((value) => {
                    if (value.isEditing) {
                      return (
                        <div className="flex items-center gap-1" key={value.id}>
                          <Input
                            className="h-6 w-24 px-2 py-1 text-xs"
                            onChange={(e) =>
                              handleUpdateValue(
                                category.id,
                                value.id,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="Value name"
                            value={value.name}
                          />
                          <Button
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              handleDeleteValue(category.id, value.id)
                            }
                            size="sm"
                            variant="ghost"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )
                    }

                    return (
                      <Badge
                        className="cursor-pointer hover:bg-secondary/80"
                        key={value.id}
                        onClick={() => handleEditValue(category.id, value.id)}
                        variant="secondary"
                      >
                        {value.name}
                        <button
                          className="ml-1 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteValue(category.id, value.id)
                          }}
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                  {category.values.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      No values yet
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {categories.length !== 0 && (
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
    </div>
  )
}
