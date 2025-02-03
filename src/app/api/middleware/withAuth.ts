import { User } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { infer as ZodInfer, ZodObject, ZodRawShape } from 'zod'
import { authUserRequest } from '../auth'
import { handleAPIResponse } from '../error-response'
import { APIError } from '../errors'

interface withAuthHandler {
  ({ req }: { req: Request; user: User }): Promise<NextResponse>
}
interface withAuthBodyHandler {
  (params: { req: Request; user: User; body: any }): Promise<NextResponse>
}

export const withAuth = async (handler: withAuthHandler) => {
  return async (req: NextRequest) => {
    try {
      const { data, error } = await authUserRequest()
      if (error) {
        throw error
      }

      if (!data) {
        throw new APIError({
          code: 'unauthorized',
          message: 'No user found',
        })
      }
      return handler({
        req,
        user: data.user,
      })
    } catch (e) {
      return handleAPIResponse(e)
    }
  }
}

export const withAuthBody = async (handler: withAuthBodyHandler) => {
  return async (req: NextRequest) => {
    try {
      const { data, error } = await authUserRequest()
      if (error) {
        throw error
      }

      const body = await req.json()
      if (!body) {
        throw new APIError({
          code: 'bad_request',
          message: 'Request body is required for this endpoint',
        })
      }
      if (!data) {
        throw new APIError({
          code: 'unauthorized',
          message: 'No user found',
        })
      }
      return handler({
        req,
        user: data.user,
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

export const withAuthBodySchema = async <T extends ZodRawShape>(
  { schema }: { schema: ZodObject<T> },
  handler: WithAuthBodyHandler<ZodInfer<ZodObject<T>>>
) => {
  return async (req: NextRequest) => {
    try {
      const { data, error } = await authUserRequest()
      if (error) {
        throw error
      }

      const body = await req.json()
      if (!body) {
        throw new APIError({
          code: 'bad_request',
          message: 'Request body is required for this endpoint',
        })
      }

      if (!data) {
        throw new APIError({
          code: 'unauthorized',
          message: 'No user found',
        })
      }

      const parsedBody = schema.safeParse(body)
      if (!parsedBody.success) {
        throw parsedBody.error
      }

      return handler({
        req,
        user: data.user,
        body: parsedBody.data,
      })
    } catch (e) {
      return handleAPIResponse(e)
    }
  }
}
