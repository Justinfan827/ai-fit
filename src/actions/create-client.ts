'use server'

import newTrainerRepo from '@/lib/supabase/server/users/trainer-repo'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { withActionAuthSchema } from './middleware/withAuth'

// This schema is used to validate input from client.
const schema = z.object({
  firstName: z.string().min(2, {
    message: 'First name must be at least 2 characters.',
  }),
  lastName: z.string().min(2, {
    message: 'Last name must be at least 2 characters.',
  }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
})

export const createClientAction = withActionAuthSchema(
  {
    schema,
  },
  async ({ data, user }) => {
    const { data: userData, error } = await newTrainerRepo().createClient({
      trainerId: user.id,
      newClient: data,
    })
    if (error) {
      return {
        data: null,
        error,
      }
    }
    revalidatePath('/home')
    return {
      data: userData,
      error,
    }
  }
)
