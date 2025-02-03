import { ErrorBase, ErrorOptions } from '@/lib/error-base'
import { z, ZodError } from 'zod'
import { generateErrorMessage } from 'zod-error'

export const ErrorCode = z.enum([
  'bad_request',
  'not_found',
  'internal_server_error',
  'unauthorized',
  'forbidden',
  'rate_limit_exceeded',
  'invite_expired',
  'invite_pending',
  'exceeded_limit',
  'conflict',
  'unprocessable_entity',
])

export type ErrorCode = z.infer<typeof ErrorCode>

export class APIError extends ErrorBase<ErrorCode> {
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
export const ErrBase = z.object({
  code: ErrorCode,
  message: z.string(),
})

export const ErrorSchema = z.object({
  error: ErrBase,
})

export type ErrorResponse = z.infer<typeof ErrorSchema>

export function fromZodError(error: ZodError): ErrorResponse {
  return {
    error: {
      code: 'unprocessable_entity',
      message: generateErrorMessage(error.issues, {
        maxErrors: 1,
        delimiter: {
          component: ': ',
        },
        path: {
          enabled: true,
          type: 'objectNotation',
          label: '',
        },
        code: {
          enabled: true,
          label: '',
        },
        message: {
          enabled: true,
          label: '',
        },
      }),
    },
  }
}
export const errorCodeToHttpStatus: Record<ErrorCode, number> = {
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
