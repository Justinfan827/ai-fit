import { authUserRequest } from '@/app/api/auth'
import { asError } from '@/app/api/error-response'
import { APIError } from '@/app/api/errors'
import { User } from '@supabase/supabase-js'
import { infer as ZodInfer, ZodObject, ZodRawShape } from 'zod'

type AuthAction<T extends ZodRawShape, R extends any> = ({
  data,
}: {
  data: T
  user: User
}) => Promise<R>

/*
 * withAuthAuthSchema is a higher order function that lets
 * you create a server action function that requires authentication.
 */
export const withActionAuthSchema = <T extends ZodRawShape, R>(
  { schema }: { schema: ZodObject<T> },
  action: AuthAction<ZodInfer<ZodObject<T>>, R>
) => {
  return async (data: ZodInfer<ZodObject<T>>) => {
    try {
      const user = await authUserRequest()
      if (!data) {
        throw new APIError({
          code: 'bad_request',
          message: 'form data is required',
        })
      }

      const parsedBody = schema.safeParse(data)
      if (!parsedBody.success) {
        throw parsedBody.error
      }

      return action({ user, data: parsedBody.data })
    } catch (e) {
      return asError(e)
    }
  }
}
