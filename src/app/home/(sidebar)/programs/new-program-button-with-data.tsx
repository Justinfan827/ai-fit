import { getCachedAuthUserT } from "@/lib/supabase/server/auth-utils"
import { getCachedAllExercisesT } from "@/lib/supabase/server/users/trainer-repo"
import NewProgramButton from "./new-program-button"

export default async function NewProgramButtonWithData() {
  const authUser = await getCachedAuthUserT()
  const exercises = await getCachedAllExercisesT(authUser.userId)
  return (
    <NewProgramButton exercises={exercises.base.concat(exercises.custom)} />
  )
}
