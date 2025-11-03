"use client"

import { useQuery } from "convex/react"
import { CategoryManager } from "@/components/categories/CategoryManager"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"

function CategoryManagerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => `skeleton-category-${i}`).map(
          (key) => (
            <Card key={key}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-18" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  )
}

export default function SettingsExercisesConfigurationPage() {
  const user = useQuery(api.users.getCurrentUser)
  const categoriesData = useQuery(
    api.exercises.getCategoriesWithValues,
    user ? { userId: user.id } : "skip"
  )

  // Show loading state while data is being fetched
  if (!user || categoriesData === undefined) {
    return (
      <>
        <SiteHeader left={<div>Configuration</div>} />
        <div className="container mx-auto p-6">
          <CategoryManagerSkeleton />
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
      <SiteHeader left={<div>Configuration</div>} />
      <div className="container mx-auto p-6">
        <CategoryManager initialCategories={categories} userId={user.id} />
      </div>
    </>
  )
}
