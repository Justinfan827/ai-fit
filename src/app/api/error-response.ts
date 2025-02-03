import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import {
  APIError,
  errorCodeToHttpStatus,
  ErrorResponse,
  fromZodError,
} from './errors'

export function handleAPIResponse(e: unknown) {
  const errCodeAndMsg = asError(e)
  return NextResponse.json(
    {
      ...errCodeAndMsg,
      data: null,
    },
    {
      status: errorCodeToHttpStatus[errCodeAndMsg.error.code],
    }
  )
}

export function asError(e: any): ErrorResponse {
  if (e instanceof ZodError) {
    return fromZodError(e)
  }
  if (e instanceof APIError) {
    return {
      error: {
        code: e.code,
        message: e.message,
      },
    }
  }
  return {
    error: {
      code: 'internal_server_error',
      message:
        'An internal server error occurred. Please contact our support if the problem persists.',
    },
  }
}
