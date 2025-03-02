import 'server-only'

import createAdminClient from '@/lib/supabase/create-admin-client'

// new class to handle server-side logic to
// allow trainers to manage users
export class TrainerClientRepo {
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
}

export default function createTrainerRepo() {
  return new TrainerClientRepo()
}
