'use server'

import newTrainerRepo from '@/lib/supabase/server/users/trainer-repo'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { withActionAuthSchema } from './middleware/withAuth'

// This schema is used to validate input from client.
const schema = z.object({
  detailId: z.string(),
  clientId: z.string(),
})

export const deleteClientDetailAction = withActionAuthSchema(
  {
    schema,
  },
  async ({ data }) => {
    const { data: userData, error } =
      await newTrainerRepo().deleteClientDetailById({
        clientId: data.clientId,
        detailId: data.detailId,
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
