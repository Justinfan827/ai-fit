import { type ZodError, z } from "zod"
import { generateErrorMessage } from "zod-error"
import { ErrorBase, type ErrorOptions } from "@/lib/error-base"

const ErrorCode = z.enum([
  "bad_request",
  "not_found",
  "internal_server_error",
  "unauthorized",
  "forbidden",
  "rate_limit_exceeded",
  "invite_expired",
  "invite_pending",
  "exceeded_limit",
  "conflict",
  "unprocessable_entity",
])

type ErrorCode = z.infer<typeof ErrorCode>

class APIError extends ErrorBase<ErrorCode> {
  constructor({
    message,
    code,
    options,
  }: {
    code: ErrorCode
    message: string
    options?: ErrorOptions
  }) {
    super({ message, code, ...options })
  }
}
const ErrBaseSchema = z.object({
  code: ErrorCode,
  message: z.string(),
})

const ErrorSchema = z.object({
  error: ErrBaseSchema,
})

type ErrBase = z.infer<typeof ErrBaseSchema>
type ErrorResponse = z.infer<typeof ErrorSchema>

function fromZodError(error: ZodError): ErrorResponse {
  return {
    error: {
      code: "unprocessable_entity",
      message: generateErrorMessage(error.issues, {
        maxErrors: 1,
        delimiter: {
          component: ": ",
        },
        path: {
          enabled: true,
          type: "objectNotation",
          label: "",
        },
        code: {
          enabled: true,
          label: "",
        },
        message: {
          enabled: true,
          label: "",
        },
      }),
    },
  }
}
const errorCodeToHttpStatus: Record<ErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  exceeded_limit: 403,
  not_found: 404,
  conflict: 409,
  invite_pending: 409,
  invite_expired: 410,
  unprocessable_entity: 422,
  rate_limit_exceeded: 429,
  internal_server_error: 500,
}

export {
  APIError,
  ErrBaseSchema,
  errorCodeToHttpStatus,
  fromZodError,
  type ErrBase,
  type ErrorCode,
  type ErrorResponse,
  type ErrorSchema,
}
