import { User } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { infer as ZodInfer, ZodObject, ZodRawShape } from 'zod'
import { authUserRequest } from '../auth'
import { handleAPIResponse } from '../error-response'
import { APIError } from '../errors'

interface withPublicHandler {
  ({ req }: { req: NextRequest }): Promise<NextResponse>
}

interface withAuthHandler {
  ({ req }: { req: NextRequest; user: User }): Promise<NextResponse>
}
interface withAuthBodyHandler {
  (params: { req: NextRequest; user: User; body: any }): Promise<NextResponse>
}

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

export const withAuthBody = (handler: withAuthBodyHandler) => {
  return async (req: NextRequest) => {
    try {
      const user = await authUserRequest()
      const body = await req.json()
      if (!body) {
        throw new APIError({
          code: 'bad_request',
          message: 'Request body is required for this endpoint',
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

interface WithAuthBodyHandler<T> {
  (params: { req: NextRequest; user: User; body: T }): Promise<NextResponse>
}

export const withAuthBodySchema = <T extends ZodRawShape>(
  { schema }: { schema: ZodObject<T> },
  handler: WithAuthBodyHandler<ZodInfer<ZodObject<T>>>
) => {
  return async (req: NextRequest) => {
    try {
      const user = await authUserRequest()
      const body = await req.json()
      if (!body) {
        throw new APIError({
          code: 'bad_request',
          message: 'Request body is required for this endpoint',
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
