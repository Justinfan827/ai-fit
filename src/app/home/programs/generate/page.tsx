import { PageLayout } from '@/components/page-layout'
import { createServerClient } from '@/lib/supabase/create-server-client'
import { getCurrentUser } from '@/lib/supabase/server/database.operations.queries'
import newTrainerRepo from '@/lib/supabase/server/users/trainer-repo'
import { NextJSSearchParams } from '@/lib/types/types'
import ClientPage from './client-page'

export default async function Page({
  searchParams,
}: {
  searchParams: NextJSSearchParams
}) {
  let clientId = (await searchParams).clientId
  // check if is string[]
  if (Array.isArray(clientId)) {
    clientId = clientId[0]
  }
  const trainerRepo = newTrainerRepo()
  const serverClient = await createServerClient()
  const { data: sessiondata, error } = await serverClient.auth.getSession()
  if (error) {
    return <div>error: {error.message}</div>
  }
  if (sessiondata.session === null) {
    return <div>error: no session</div>
  }

  const [user, exercises, client] = await Promise.all([
    getCurrentUser(),
    trainerRepo.getAllExercises(sessiondata.session.user.id),
    ...(clientId ? [trainerRepo.getClientHomePageData(clientId)] : []),
  ])
  if (user.error) {
    return <div>error: {user.error.message}</div>
  }
  if (exercises.error) {
    return <div>error: {exercises.error.message}</div>
  }
  if (client.error) {
    return <div>error: {client.error.message}</div>
  }
  return (
    <PageLayout>
      <ClientPage
        baseExercises={exercises.data.base}
        trainerExercises={exercises.data.custom}
        trainerId={user.data.sbUser.id}
        clientData={client.data}
      />
    </PageLayout>
  )
}
