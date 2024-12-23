import { Database } from '@/lib/supabase/database.types'
import { createClient } from '@supabase/supabase-js'
import { infoLog } from './utils'

export default async function runUserCreation({
  email,
  supabaseURL,
  supabaseServiceRoleKey,
  opts: { isTrainer, setTrainerId } = { isTrainer: false },
}: {
  email: string
  supabaseURL: string
  supabaseServiceRoleKey: string
  opts?: {
    isTrainer: boolean
    setTrainerId?: string
  }
}) {
  const sb = createClient<Database>(supabaseURL, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const adminAuthClient = sb.auth.admin

  // get user
  const { data: user, error: userErr } = await sb
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle()
  if (userErr) {
    throw userErr
  }

  const authUserUUID = await (async () => {
    if (!user) {
      infoLog(`User not found. Creating ${isTrainer ? 'trainer' : ''} user...`)
      const { data: userData, error: createUserErr } =
        await adminAuthClient.createUser({
          email,
          email_confirm: true,
          app_metadata: {
            provider: 'email',
            providers: ['email'],
          },
        })
      if (createUserErr) {
        throw createUserErr
      }
      return userData.user.id
    }
    infoLog('User found... not creating user.')
    return user.id
  })()

  const role = isTrainer ? 'TRAINER' : 'CLIENT'

  infoLog(`Setting role for user: ${authUserUUID} to ${role}`)
  const { data, error: rpcErr } = await sb.rpc('set_claim', {
    uid: authUserUUID,
    claim: 'USER_ROLE',
    value: isTrainer ? 'TRAINER' : 'CLIENT',
  })
  if (rpcErr) {
    throw new Error(rpcErr.message)
  }
  if (data === 'error: access denied') {
    throw new Error(data)
  }

  {
    const { error: setTrainerErr } = await sb
      .from('users')
      .update({
        trainer_id: setTrainerId ? setTrainerId : null,
        first_name: isTrainer ? 'Trainer' : 'Client',
        last_name: 'Fan',
      })
      .eq('id', authUserUUID)
    if (setTrainerErr) {
      throw new Error(`${setTrainerErr}`)
    }
  }

  return authUserUUID
}
