'use server'

import newTrainerRepo from '@/lib/supabase/server/users/trainer-repo'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { withActionAuthSchema } from './middleware/withAuth'

// This schema is used to validate input from client.
const schema = z.object({
  clientId: z.string(),
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  description: z.string().min(2, {
    message: 'Description must be at least 2 characters.',
  }),
})

export const createClientDetailAction = withActionAuthSchema(
  {
    schema,
  },
  async ({ data, user }) => {
    const { data: userData, error } =
      await newTrainerRepo().updateClientDetails({
        trainerId: user.id,
        ...data,
      })
    if (error) {
      return {
        data: null,
        error,
      }
    }
    revalidatePath(`/home/clients/${data.clientId}`)
    return {
      data: userData,
      error: null,
    }
  }
)
