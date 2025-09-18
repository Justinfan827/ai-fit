import "server-only"

import type { NextRequest, NextResponse } from "next/server"
import type { infer as ZodInfer, ZodObject, ZodRawShape } from "zod"
import {
  type AuthUser,
  authUserRequest,
} from "@/lib/supabase/server/auth-utils"
import { handleAPIResponse } from "../error-response"
import { APIError } from "../errors"

type withPublicHandler = ({
  req,
}: {
  req: NextRequest
}) => Promise<NextResponse>

type withAuthHandler = ({
  req,
}: {
  req: NextRequest
  user: AuthUser
}) => Promise<NextResponse>

type withAuthBodyHandler<T> = (params: {
  req: NextRequest
  user: AuthUser
  body: T
}) => Promise<Response>

export const withPublic = (handler: withPublicHandler) => {
  return (req: NextRequest) => {
    try {
      return handler({ req })
    } catch (e) {
      return handleAPIResponse(e)
    }
  }
}

export const withAuth = (handler: withAuthHandler) => {
  return async (req: NextRequest) => {
    try {
      const user = await authUserRequest()
      return handler({
        req,
        user,
      })
    } catch (e) {
      return handleAPIResponse(e)
    }
  }
}

export const withAuthBody = <T>(handler: withAuthBodyHandler<T>) => {
  return async (req: NextRequest) => {
    try {
      const user = await authUserRequest()
      const body = await req.json()
      if (!body) {
        throw new APIError({
          code: "bad_request",
          message: "Request body is required for this endpoint",
        })
      }
      return handler({
        req,
        user,
        body,
      })
    } catch (e) {
      return handleAPIResponse(e)
    }
  }
}

/**
 * API route handler helper to handle auth, and also parsing the
 * response body into an expected schema.
 */
export const withAuthBodySchema = <T extends ZodRawShape>(
  { schema }: { schema: ZodObject<T> },
  handler: withAuthBodyHandler<ZodInfer<ZodObject<T>>>
) => {
  return async (req: NextRequest) => {
    try {
      const user = await authUserRequest()
      const body = await req.json()
      if (!body) {
        throw new APIError({
          code: "bad_request",
          message: "Request body is required for this endpoint",
        })
      }

      const parsedBody = schema.safeParse(body)
      if (!parsedBody.success) {
        throw parsedBody.error
      }

      return handler({
        req,
        user,
        body: parsedBody.data,
      })
    } catch (e) {
      return handleAPIResponse(e)
    }
  }
}
