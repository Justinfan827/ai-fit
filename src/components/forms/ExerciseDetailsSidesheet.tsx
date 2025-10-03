"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTransition } from "react"
import { type UseFormReturn, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import {
  type CreateExerciseInput,
  createExercise,
} from "@/actions/create-exercise"
import { updateExercise } from "@/actions/update-exercise"
import { Icons } from "@/components/icons"
import type { TableExercise } from "@/components/tables/exercise-table/types"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Tags,
  TagsContent,
  TagsEmpty,
  TagsInput,
  TagsItem,
  TagsList,
  TagsTrigger,
  TagsValue,
} from "@/components/ui/kibo-ui/tags"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { YouTubeVideo } from "@/components/ui/youtube-video"
import type { Exercise } from "@/lib/domain/workouts"
import type { CategoryWithValues } from "@/lib/types/categories"
import LoadingButton from "../loading-button"
import { asTableExercise } from "../tables/exercise-table/utils"
import { Alert, AlertTitle } from "../ui/alert"

const exerciseFormSchema = z.object({
  name: z.string().min(1, { error: "Exercise name is required" }),
  notes: z.string().optional(),
  video_url: z.url().optional().or(z.literal("")),
  category_assignments: z.record(z.string(), z.array(z.string())).optional(),
})

type ExerciseFormValues = z.infer<typeof exerciseFormSchema>

/**
 * Converts form values and current exercise into an Exercise object for the updateExercise action
 */
const createExerciseFromFormValues = (
  currentExercise: TableExercise,
  formValues: ExerciseFormValues,
  categories: CategoryWithValues[]
): Exercise => {
  // Convert form category assignments to Exercise categories format
  const exerciseCategories = categories
    .map((category) => {
      const assignedValueIds =
        formValues.category_assignments?.[category.id] || []

      if (assignedValueIds.length === 0) {
        return null // Skip categories with no assigned values
      }

      const assignedValues = assignedValueIds
        .map((valueId) => {
          const value = category.values.find((v) => v.id === valueId)
          return value ? { id: value.id, name: value.name } : null
        })
        .filter(Boolean) as { id: string; name: string }[]

      return {
        id: category.id,
        name: category.name,
        values: assignedValues,
      }
    })
    .filter(Boolean) as Exercise["categories"]

  return {
    ...currentExercise.originalExercise,
    name: formValues.name,
    videoURL: formValues.video_url || "",
    description: formValues.notes || "",
    categories: exerciseCategories,
  }
}

interface ExerciseDetailsModalProps {
  exercise: TableExercise
  categories: CategoryWithValues[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onExerciseUpdated: (ex: TableExercise) => void
}

interface CategoryTagsState {
  [categoryId: string]: string[]
}

export const ExerciseDetailsSidesheet = ({
  exercise,
  categories,
  open,
  onOpenChange,
  onExerciseUpdated,
}: ExerciseDetailsModalProps) => {
  const [isPending, startTransition] = useTransition()

  const isCustomExercise = exercise.isCustom
  const isEditMode = isCustomExercise
  // Helper function to parse existing category assignments from exercise
  const parseExistingCategoryAssignments = (): CategoryTagsState => {
    const assignments: CategoryTagsState = {}
    // Initialize all categories with empty arrays
    for (const category of categories) {
      assignments[category.id] = []
    }

    // Populate with existing assignments from exercise.categoryAssignments
    for (const exerciseCategory of exercise.originalExercise.categories) {
      // Find the matching category in our categories list
      const category = categories.find((c) => c.id === exerciseCategory.id)
      if (!category || exerciseCategory.values.length === 0) {
        continue
      }
      // exerciseCategory.values is an array of { id, name } objects
      for (const exerciseValue of exerciseCategory.values) {
        const matchingValue = category.values.find(
          (value) => value.id === exerciseValue.id
        )
        if (matchingValue) {
          assignments[category.id].push(matchingValue.id)
        }
      }
    }

    return assignments
  }
  const initialCategoryAssignments = parseExistingCategoryAssignments()
  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: exercise.name,
      notes: exercise.notes || "",
      video_url:
        // TODO: remove default here.
        exercise.videoURL || "",
      category_assignments: initialCategoryAssignments,
    },
  })

  const handleUpdateExercise = async (values: ExerciseFormValues) => {
    const exerciseToUpdate = createExerciseFromFormValues(
      exercise,
      values,
      categories
    )
    const { error } = await updateExercise(exerciseToUpdate)

    if (error) {
      throw new Error(error.message || "Failed to update exercise")
    }

    // Update the UI with the updated exercise data
    onExerciseUpdated(asTableExercise(exerciseToUpdate))
  }

  const handleSubmit = (values: ExerciseFormValues) => {
    startTransition(async () => {
      try {
        if (isEditMode) {
          await handleUpdateExercise(values)
        } else {
          // Create new custom exercise based on base exercise
          await createExercise(values as CreateExerciseInput)
        }

        toast.success(
          isEditMode
            ? "Exercise updated successfully"
            : "Custom exercise created successfully"
        )
        onOpenChange(false)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "An error occurred"
        )
      }
    })
  }

  const handleCategoryChange = (categoryId: string, valueIds: string[]) => {
    const currentAssignments = form.getValues("category_assignments") || {}
    const newAssignments = { ...currentAssignments, [categoryId]: valueIds }
    form.setValue("category_assignments", newAssignments)
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="flex min-w-[450px] flex-col gap-0">
        <SheetHeader className="flex-shrink-0 gap-2">
          <SheetTitle className="flex items-center gap-2">
            {exercise.name}
          </SheetTitle>
          {!exercise.isCustom && (
            <Alert>
              <Icons.info className="h-4 w-4" />
              <AlertTitle>
                <SheetDescription>
                  Editing this exercise will create a new custom exercise.
                </SheetDescription>
              </AlertTitle>
            </Alert>
          )}
        </SheetHeader>
        <div className="scrollbar scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent flex-1 space-y-6 overflow-y-auto px-4 py-4">
          <ExerciseDetailsForm
            categories={categories}
            form={form}
            handleSubmit={handleSubmit}
            isCustomExercise={isCustomExercise}
            onCategoryChange={handleCategoryChange}
          />
        </div>
        <SheetFooter className="flex flex-shrink-0 flex-row justify-end gap-2 border-t pb-4">
          <Button
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <LoadingButton
            disabled={isPending}
            form="exercise-details-form"
            isLoading={isPending}
            type="submit"
          >
            Save
          </LoadingButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function ExerciseDetailsForm({
  form,
  handleSubmit,
  categories,
  onCategoryChange,
  isCustomExercise,
}: {
  form: UseFormReturn<ExerciseFormValues>
  handleSubmit: (values: ExerciseFormValues) => void
  categories: CategoryWithValues[]
  onCategoryChange: (categoryId: string, valueIds: string[]) => void
  isCustomExercise: boolean
}) {
  // Watch the category assignments from the form
  const categoryAssignments = form.watch("category_assignments") || {}
  return (
    <Form {...form}>
      <form
        className="space-y-4"
        id="exercise-details-form"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exercise Name*</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter exercise name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="video_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Video URL</FormLabel>
              <FormControl>
                <Input {...field} placeholder="" type="url" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.watch("video_url") && (
          <div className="flex w-full justify-center">
            <YouTubeVideo
              title={form.watch("name")}
              url={form.watch("video_url") || ""}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exercise Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Add instructions, tips, or notes for this exercise..."
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Custom Categories Section */}
        {isCustomExercise && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Custom Categories</h3>
            {categories.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                No custom categories found. Create categories first to assign
                values to exercises.
              </div>
            ) : (
              categories.map((category) => (
                <CategoryTagsField
                  category={category}
                  key={category.id}
                  onSelectionChange={(valueIds) =>
                    onCategoryChange(category.id, valueIds)
                  }
                  selectedValues={categoryAssignments[category.id] || []}
                />
              ))
            )}
          </div>
        )}
      </form>
    </Form>
  )
}

function CategoryTagsField({
  category,
  selectedValues,
  onSelectionChange,
}: {
  category: CategoryWithValues
  selectedValues: string[]
  onSelectionChange: (valueIds: string[]) => void
}) {
  const handleTagRemove = (valueId: string) => {
    const newSelection = selectedValues.filter((id) => id !== valueId)
    onSelectionChange(newSelection)
  }

  const handleTagAdd = (valueId: string) => {
    if (!selectedValues.includes(valueId)) {
      onSelectionChange([...selectedValues, valueId])
    }
  }

  const getValueName = (valueId: string) => {
    return category.values.find((v) => v.id === valueId)?.name || ""
  }

  const availableValues = category.values.filter(
    (v) => !selectedValues.includes(v.id)
  )

  return (
    <div className="space-y-2">
      <FormLabel>{category.name}</FormLabel>
      {category.description && (
        <p className="text-muted-foreground text-sm">{category.description}</p>
      )}

      <Tags>
        <TagsTrigger>
          {selectedValues.map((valueId) => (
            <TagsValue key={valueId} onRemove={() => handleTagRemove(valueId)}>
              {getValueName(valueId)}
            </TagsValue>
          ))}
        </TagsTrigger>

        <TagsContent>
          <TagsInput placeholder={`Search ${category.name.toLowerCase()}...`} />
          <TagsList>
            <TagsEmpty>No {category.name.toLowerCase()} found.</TagsEmpty>
            {availableValues.map((value) => (
              <TagsItem key={value.id} onSelect={() => handleTagAdd(value.id)}>
                {value.name}
              </TagsItem>
            ))}
          </TagsList>
        </TagsContent>
      </Tags>
    </div>
  )
}
