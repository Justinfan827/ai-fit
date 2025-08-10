import { createServerClient } from "@/lib/supabase/create-server-client"
import { getAllExercises } from "@/lib/supabase/server/users/trainer-repo"
import NewProgramButton from "./new-program-button"

export default async function NewProgramButtonWithData() {
  const serverClient = await createServerClient()
  const { data: sessiondata, error } = await serverClient.auth.getSession()

  if (error) {
    return <div>Error: {error.message}</div>
  }

  if (sessiondata.session === null) {
    return <div>Error: no session</div>
  }

  const exercises = await getAllExercises(sessiondata.session.user.id)

  if (exercises.error) {
    return <div>Error: {exercises.error.message}</div>
  }

  return <NewProgramButton exercises={exercises.data.base} />
}
