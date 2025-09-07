import type { z } from "zod"
import { asError } from "@/app/api/error-response"
import log from "@/lib/logger/logger"
import {
  type AuthUser,
  authUserRequest,
} from "@/lib/supabase/server/auth-utils"

interface BaseArgs {
  user: AuthUser
}
interface ArgsWithInput<TInput> extends BaseArgs {
  input: TInput
}
type WithAuthHandler<TResult> = (args: BaseArgs) => Promise<TResult>
type WithAuthInputHandler<TInput, TResult> = (
  args: ArgsWithInput<TInput>
) => Promise<TResult>

/**
 * Auth guard for server actions
 */
const withAuth = <TResult>(handler: WithAuthHandler<TResult>) => {
  return async () => {
    let user: AuthUser | undefined
    try {
      user = await authUserRequest()
      const result = await handler({ user })
      return {
        data: result,
        error: null,
      }
    } catch (e) {
      log.errorWithStack("server action error", e, {
        action: "withAuth",
        userId: user?.userId || "unknown",
      })
      return {
        ...asError(e),
        data: null,
      }
    }
  }
}

/**
 * Server action auth guard with input validation using a zod schema
 */
const withAuthInput = <TInput, TResult>(
  { schema }: { schema: z.Schema<TInput> },
  handler: WithAuthInputHandler<TInput, TResult>
) => {
  return async (input: TInput) => {
    let user: AuthUser | undefined
    try {
      user = await authUserRequest()
      const parsedInput = schema.safeParse(input)
      if (!parsedInput.success) {
        throw parsedInput.error
      }

      const result = await handler({
        user,
        input: parsedInput.data,
      })
      return {
        data: result,
        error: null,
      }
    } catch (e) {
      console.log("server action error", e instanceof Error)
      log.errorWithStack("server action error", e, {
        action: "withAuthInput",
        userId: user?.userId || "unknown",
      })
      return {
        ...asError(e),
        data: null,
      }
    }
  }
}

export { withAuth, withAuthInput }
