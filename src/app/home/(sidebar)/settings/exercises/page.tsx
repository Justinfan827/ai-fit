import { SiteHeader } from "@/components/site-header"
import { getCachedAuthUserT } from "@/lib/supabase/server/auth-utils"
import { getCachedAllExercisesT } from "@/lib/supabase/server/users/trainer-repo"
import { ClientExercisesPage } from "./ClientExercisesPage"

export default async function SettingsExercisesPage() {
  const authUser = await getCachedAuthUserT()
  const exercises = getCachedAllExercisesT(authUser.userId)
  return (
    <>
      <SiteHeader left={"Exercises"} />
      <div
        // NOTE: This is the full height minus the header and the inset height.
        className="@container/main scrollbar scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent h-[calc(100svh-var(--header-height)-2*var(--inset-height))] overflow-y-auto rounded-xl py-4"
        id="exercises content"
      >
        <div className="flex flex-col gap-4 bg-background pb-4 md:gap-6 md:px-4">
          <ClientExercisesPage exercisesPromise={exercises} />
        </div>
      </div>
    </>
  )
}
