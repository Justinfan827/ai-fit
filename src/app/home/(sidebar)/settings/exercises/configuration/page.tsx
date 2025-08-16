import { Suspense } from "react"
import { CategoryManager } from "@/components/categories/CategoryManager"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getUserCategories } from "@/lib/supabase/server/database.operations.queries"

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
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={`skeleton-${i}`}>
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
        ))}
      </div>
    </div>
  )
}

async function CategoryManagerWithData() {
  const { data: categories, error } = await getUserCategories()

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`)
  }

  return <CategoryManager initialCategories={categories || []} />
}

export default function SettingsExercisesConfigurationPage() {
  return (
    <>
      <SiteHeader left={<div>Configuration</div>} />
      <div className="container mx-auto p-6">
        <Suspense fallback={<CategoryManagerSkeleton />}>
          <CategoryManagerWithData />
        </Suspense>
      </div>
    </>
  )
}
