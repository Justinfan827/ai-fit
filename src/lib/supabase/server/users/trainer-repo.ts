import 'server-only'

import { ClientHomePage } from '@/lib/domain/clients'
import { Exercise } from '@/lib/domain/workouts'
import createAdminClient from '@/lib/supabase/create-admin-client'
import { Maybe } from '@/lib/types/types'
import { v4 as uuidv4 } from 'uuid'
import { createServerClient } from '../../create-server-client'
import { resolvePrograms } from '../programs/utils'

/*
 * Thin data layer to handle server-side logic for trainers
 */
export default function newTrainerRepo() {
  return new TrainerClientRepo()
}

// new class to handle server-side logic to
// allow trainers to manage users
export class TrainerClientRepo {
  // Fetches all exercises from the database that the trainer
  // can assign to clients. This includes the 'base' list of exercises,
  // as well as any custom exercises the trainer has created.
  public async getAllExercises(
    trainerId: string
  ): Promise<Maybe<{ base: Exercise[]; custom: Exercise[] }>> {
    const sb = await createServerClient()
    const [base, custom] = await Promise.all([
      sb.from('exercises').select('*').is('owner_id', null),
      sb.from('exercises').select('*').eq('owner_id', trainerId),
    ])
    if (base.error) {
      return {
        data: null,
        error: base.error,
      }
    }
    if (custom.error) {
      return {
        data: null,
        error: custom.error,
      }
    }

    const baseData = base.data.map((e) => ({
      id: e.id,
      name: e.name,
      muscleGroup: e.primary_trained_colloquial || '',
      ownerId: e.owner_id,
    }))
    const customData = custom.data.map((e) => ({
      id: e.id,
      name: e.name,
      muscleGroup: e.primary_trained_colloquial || '',
      ownerId: e.owner_id,
    }))
    return {
      data: {
        base: baseData,
        custom: customData,
      },
      error: null,
    }
  }

  // this method will be used to create a new user
  // in the database
  public async createClient({
    trainerId,
    newClient: { firstName, lastName, email },
  }: {
    trainerId: string
    newClient: { firstName: string; lastName: string; email: string }
  }) {
    const sb = await createAdminClient()
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password: email,
      email_confirm: true,
      app_metadata: {
        provider: 'email',
        providers: ['email'],
      },
    })
    console.log({ error })
    if (error) {
      return { data: null, error }
    }

    const { error: rpcErr } = await sb.rpc('set_claim', {
      uid: data.user.id,
      claim: 'USER_ROLE',
      value: 'CLIENT',
    })
    if (rpcErr) {
      return { data: null, error: rpcErr }
    }
    const { error: insertErr } = await sb
      .from('users')
      .update({
        trainer_id: trainerId,
        first_name: firstName,
        last_name: lastName,
      })
      .eq('id', data.user.id)
    if (insertErr) {
      return { data: null, error: insertErr }
    }
    return {
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          first_name: firstName,
          last_name: lastName,
          trainer_id: trainerId,
        },
      },
      error: null,
    }
  }

  public async deleteClientDetailById({
    clientId,
    detailId,
  }: {
    clientId: string
    detailId: string
  }) {
    const sb = await createServerClient()
    const { data, error } = await sb
      .from('users')
      .select('metadata')
      .eq('id', clientId)
      .single()
    if (error) {
      return { data: null, error }
    }
    const metadata: any = data.metadata || {}
    metadata.details = (metadata.details || []).filter((d) => d.id !== detailId)
    const { data: user, error: updateErr } = await sb
      .from('users')
      .update({
        metadata,
      })
      .eq('id', clientId)
      .select('*')
    if (updateErr) {
      return { data: null, error: updateErr }
    }
    return {
      data: { user },
      error: null,
    }
  }

  public async updateClientDetails({
    trainerId,
    clientId,
    title,
    description,
  }: {
    trainerId: string
    clientId: string
    title: string
    description: string
  }) {
    const sb = await createServerClient()
    const { data, error } = await sb
      .from('users')
      .select('metadata')
      .eq('id', clientId)
      .single()
    if (error) {
      return { data: null, error }
    }
    const metadata: any = data.metadata || {}
    metadata.details = metadata.details || []
    metadata.details.push({
      id: uuidv4(),
      title,
      description,
    })

    const { data: user, error: updateErr } = await sb
      .from('users')
      .update({
        metadata,
      })
      .eq('id', clientId)
      .select('*')
    if (updateErr) {
      return { data: null, error: updateErr }
    }
    return {
      data: { user },
      error: null,
    }
  }

  /*
   * Fetch the data required for the home page of the client.
   * Includes:
   * - Assigned client programs
   * - Client details e.g. any trainer created notes
   */
  public async getClientHomePageData(
    clientId: string
  ): Promise<Maybe<ClientHomePage>> {
    const sb = await createServerClient()

    const { data: userRes, error: getUserError } = await sb.auth.getUser()
    if (getUserError) {
      return { data: null, error: getUserError }
    }

    const { data: client, error: clientError } = await sb
      .from('users')
      .select('*')
      .eq('trainer_id', userRes.user.id)
      .eq('id', clientId)
      .single()

    if (clientError) {
      return { data: null, error: clientError }
    }

    const { data: pData, error: pErr } = await sb
      .from('programs')
      .select('*')
      .eq('user_id', client.id)
      .order('created_at', { ascending: false })

    if (pErr) {
      return { data: null, error: pErr }
    }

    const { data: progData, error: progErr } = await resolvePrograms(sb, pData)
    if (progErr) {
      return { data: null, error: progErr }
    }

    const metadata = (client.metadata as any) || {}

    return {
      data: {
        id: client.id,
        email: client.email || '',
        firstName: client.first_name || '',
        lastName: client.last_name || '',
        programs: progData,
        age: metadata.age || 0,
        gender: metadata.gender,
        liftingExperienceMonths: metadata.lifting_experience_months
          ? metadata.lifting_experience_months
          : 0,
        weightKg: metadata.weight_kg || 0,
        heightCm: metadata.height_cm || 0,
        details: metadata?.details || [],
      },
      error: null,
    }
  }
}
