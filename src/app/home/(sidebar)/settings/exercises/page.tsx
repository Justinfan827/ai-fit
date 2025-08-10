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
        className="@container/main flex flex-1 flex-col"
        id="exercises_content"
      >
        <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
          <ClientExercisesPage exercisesPromise={exercises} />
        </div>
      </div>
    </>
  )
}
