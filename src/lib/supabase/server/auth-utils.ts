import "server-only"

import type { JwtPayload } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { cache } from "react"
import { APIError } from "@/app/api/errors"
import { createServerClient } from "../create-server-client"

type AuthCheck = AuthCheckFailed | AuthCheckSuccess

export type AuthUser = {
  email: string
  userId: string
  sessionId: string
}

type AuthCheckFailed = {
  error: Error
  user: null
}

type AuthCheckSuccess = {
  error: null
  user: AuthUser
}

export const getCachedAuthUserT = cache(async (): Promise<AuthUser> => {
  const { user, error } = await getAuthUser()
  if (error) {
    throw error
  }
  return user
})

/*
 * getAuthUser is a utility function to fetch the authenticated user.
 * It returns the user and session if they exist.
 **/
export async function getAuthUser(): Promise<AuthCheck> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error) {
    return { user: null, error }
  }
  if (!data?.claims) {
    return {
      user: null,
      error: new APIError({
        code: "unauthorized",
        message: "No user found",
      }),
    }
  }
  return { user: getUserDetailsFromClaims(data.claims), error: null }
}

/**
 * authUserRequest is meant to be used authenticate API requests in
 * server actions and also in API route handlers. This function throws on
 * errors
 */
export async function authUserRequest() {
  const { user, error: authError } = await getAuthUser()
  if (authError) {
    throw authError
  }
  return user
}

function getUserDetailsFromClaims(claims: JwtPayload): AuthUser {
  return {
    userId: claims.sub,
    sessionId: claims.session_id,
    email: claims.email as string,
  }
}

/**
 * serverRedirectToHomeIfAuthorized can be used in server components
 * to redirect to the users home page if the user is authorized
 */
export const redirectAuthorizedUser = async () => {
  const authUser = await getAuthUser()
  if (authUser.user) redirect("/home/clients")
}
