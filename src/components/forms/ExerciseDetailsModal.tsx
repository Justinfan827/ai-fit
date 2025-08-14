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
import {
  type UpdateExerciseInput,
  updateExercise,
} from "@/actions/update-exercise"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { YouTubeVideo } from "@/components/ui/youtube-video"
import LoadingButton from "../loading-button"
import { Alert, AlertTitle } from "../ui/alert"

const exerciseFormSchema = z.object({
  name: z.string().min(1, "Exercise name is required"),
  notes: z.string().optional(),
  video_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  primary_benefit: z.string().optional(),
  primary_trained_colloquial: z.string().optional(),
  skill_requirement: z.string().optional(),
})

type ExerciseFormValues = z.infer<typeof exerciseFormSchema>

interface ExerciseDetailsModalProps {
  exercise: TableExercise
  open: boolean
  onOpenChange: (open: boolean) => void
  onExerciseUpdated?: () => void
}

export const ExerciseDetailsModal = ({
  exercise,
  open,
  onOpenChange,
  onExerciseUpdated,
}: ExerciseDetailsModalProps) => {
  const [isPending, startTransition] = useTransition()

  const isCustomExercise = exercise.isCustom
  const isEditMode = isCustomExercise

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: exercise.name,
      notes: exercise.notes || "",
      video_url:
        exercise.videoURL || "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      primary_benefit: "",
      primary_trained_colloquial: "",
      skill_requirement: "",
    },
  })

  const handleSubmit = (values: ExerciseFormValues) => {
    startTransition(async () => {
      try {
        if (isEditMode) {
          // Update existing custom exercise
          await updateExercise({
            id: exercise.id,
            ...values,
          } as UpdateExerciseInput)
        } else {
          // Create new custom exercise based on base exercise
          await createExercise(values as CreateExerciseInput)
        }

        toast.success(
          isEditMode
            ? "Exercise updated successfully"
            : "Custom exercise created successfully"
        )
        onExerciseUpdated?.()
        onOpenChange(false)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "An error occurred"
        )
      }
    })
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
          <ExerciseDetailsForm form={form} handleSubmit={handleSubmit} />
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
}: {
  form: UseFormReturn<ExerciseFormValues>
  handleSubmit: (values: ExerciseFormValues) => void
}) {
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
                <Input
                  {...field}
                  placeholder="https://www.youtube.com/watch?v=..."
                  type="url"
                />
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

        <FormField
          control={form.control}
          name="primary_trained_colloquial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Muscles Trained</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Chest, Shoulders, Triceps"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primary_benefit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Benefit</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Builds upper body strength"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="skill_requirement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skill Requirement</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Beginner, Intermediate, Advanced"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
