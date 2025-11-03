"use client"

import { useQuery } from "convex/react"
import { SiteHeader } from "@/components/site-header"
import { api } from "@/convex/_generated/api"
import { ClientExercisesPage } from "./ClientExercisesPage"

export default function SettingsExercisesPage() {
  const user = useQuery(api.users.getCurrentUser)
  const exercises = useQuery(
    api.exercises.getAllExercisesForUser,
    user ? { userId: user.id } : "skip"
  )
  const categoriesData = useQuery(
    api.exercises.getCategoriesWithValues,
    user ? { userId: user.id } : "skip"
  )

  // Show loading state while data is being fetched
  if (!user || exercises === undefined || categoriesData === undefined) {
    return (
      <>
        <SiteHeader left={"Exercises"} />
        <div
          className="@container/main scrollbar scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent h-[calc(100svh-var(--header-height)-2*var(--inset-height))] overflow-y-auto rounded-xl py-4"
          id="exercises content"
        >
          <div className="flex flex-col items-center justify-center gap-4 bg-background pb-4 md:gap-6 md:px-4">
            <p className="text-muted-foreground">Loading exercises...</p>
          </div>
        </div>
      </>
    )
  }

  // Transform Convex data to match CategoryWithValues interface
  const categories = categoriesData.map((category) => ({
    id: category._id,
    name: category.name,
    description: category.description ?? null,
    userId: category.userId,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    deletedAt: category.deletedAt ?? null,
    values: category.values.map((value) => ({
      id: value._id,
      categoryId: value.categoryId,
      name: value.name,
      description: value.description ?? null,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      deletedAt: value.deletedAt ?? null,
    })),
  }))

  return (
    <>
      <SiteHeader left={"Exercises"} />
      <div
        // NOTE: This is the full height minus the header and the inset height.
        className="@container/main scrollbar scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent h-[calc(100svh-var(--header-height)-2*var(--inset-height))] overflow-y-auto rounded-xl py-4"
        id="exercises content"
      >
        <div className="flex flex-col gap-4 bg-background pb-4 md:gap-6 md:px-4">
          <ClientExercisesPage
            categories={categories}
            exercises={exercises}
            userId={user.id}
          />
        </div>
      </div>
    </>
  )
}
