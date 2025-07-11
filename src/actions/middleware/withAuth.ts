import type { User } from "@supabase/supabase-js"
import type { z } from "zod"
import { authUserRequest } from "@/app/api/auth"
import { asError } from "@/app/api/error-response"
import { APIError, type ErrBase } from "@/app/api/errors"
import type { Maybe } from "@/lib/types/types"

interface BaseArgs {
  user: User
}

interface ArgsWithInput<TInput> extends BaseArgs {
  input: TInput
}

// Internal utility function to handle common authentication and error handling logic
async function withAuthUtils<TInput, TResult>(options: {
  input?: TInput
  inputSchema?: z.Schema<TInput>
  handler: (args: ArgsWithInput<TInput>) => Promise<TResult>
}): Promise<Maybe<TResult, ErrBase>> {
  try {
    const { input, inputSchema, handler } = options

    const user = await authUserRequest()

    const handlerArgs: any = {
      user,
    }

    if (inputSchema) {
      if (input === undefined || input === null) {
        throw new APIError({
          code: "bad_request",
          message: "input is required",
        })
      }
      const parsedInput = inputSchema.safeParse(input)
      if (!parsedInput.success) {
        throw parsedInput.error
      }
      handlerArgs.input = parsedInput.data
    }

    console.log("Running handler with args", handlerArgs)
    const result = await handler(handlerArgs)
    return {
      data: result,
      error: null,
    }
  } catch (e) {
    return {
      ...asError(e),
      data: null,
    }
  }
}

// Handler type definitions
type WithAuthHandler<TResult> = (args: BaseArgs) => Promise<TResult>

type WithAuthInputHandler<TInput, TResult> = (
  args: ArgsWithInput<TInput>
) => Promise<TResult>

// Basic auth wrapper - just provides user
const withAuth = <TResult>(handler: WithAuthHandler<TResult>) => {
  return async () => {
    return await withAuthUtils({
      handler,
    })
  }
}

// Auth with input validation
const withAuthInput = <TInput, TResult>(
  { schema }: { schema: z.Schema<TInput> },
  handler: WithAuthInputHandler<TInput, TResult>
) => {
  return async (input: TInput) => {
    return await withAuthUtils({
      input,
      inputSchema: schema,
      handler,
    })
  }
}

// Legacy compatibility - keep the old function name
const withActionAuthSchema = withAuthInput

export { withActionAuthSchema, withAuth, withAuthInput }
