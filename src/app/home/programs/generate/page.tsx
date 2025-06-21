import { PageLayout } from '@/components/page-layout'
import { createServerClient } from '@/lib/supabase/create-server-client'
import {
  getCurrentUser,
  getCurrentUserClients,
} from '@/lib/supabase/server/database.operations.queries'
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

  // First get the required data
  const [user, exercises, clients] = await Promise.all([
    getCurrentUser(),
    trainerRepo.getAllExercises(sessiondata.session.user.id),
    getCurrentUserClients(),
  ])

  if (user.error) {
    return <div>error: {user.error.message}</div>
  }
  if (exercises.error) {
    return <div>error: {exercises.error.message}</div>
  }
  if (clients.error) {
    return <div>error: {clients.error.message}</div>
  }

  // Optionally get client data if clientId is provided
  let clientData = undefined
  if (clientId) {
    const clientResult = await trainerRepo.getClientHomePageData(clientId)
    if (clientResult.error) {
      return <div>error: {clientResult.error.message}</div>
    }
    clientData = clientResult.data
  }

  return (
    <PageLayout>
      <ClientPage
        baseExercises={exercises.data.base}
        trainerExercises={exercises.data.custom}
        trainerId={user.data.sbUser.id}
        clientData={clientData}
        availableClients={clients.data.map((c) => ({
          ...c,
          programs: [],
          age: 0,
          liftingExperienceMonths: 0,
          gender: '',
          weightKg: 0,
          heightCm: 0,
          details: [],
        }))} // Convert Client[] to ClientHomePage[]
      />
    </PageLayout>
  )
}
