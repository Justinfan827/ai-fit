import { PostgrestError } from "@supabase/postgrest-js"
import { AuthError } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { ZodError } from "zod"
import {
  APIError,
  type ErrorResponse,
  errorCodeToHttpStatus,
  fromZodError,
} from "./errors"

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

export function asError(e: unknown): ErrorResponse {
  if (e instanceof AuthError) {
    return {
      error: {
        code: "unauthorized",
        message: e.message,
      },
    }
  }
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
  if (e instanceof PostgrestError) {
    return {
      error: {
        // TODO: handle different postgres codes differently
        code: "internal_server_error",
        message: e.message,
      },
    }
  }
  return {
    error: {
      code: "internal_server_error",
      message:
        "An internal server error occurred. Please contact our support if the problem persists.",
    },
  }
}
