import 'server-only'

import { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

import { APIError } from '@/app/api/errors'
import { createServerClient } from '../create-server-client'
import { isClient } from '../utils'

type AuthCheck = AuthCheckFailed | AuthCheckSuccess

type AuthCheckFailed = {
  error: Error
  user: null
}

type AuthCheckSuccess = {
  error: null
  user: User
}
/*
 * checkUserAuth is a utility function to check if a user is authenticated.
 * It returns the user and session if they exist.
 *
 * Be careful when protecting pages. The server gets the user session from the cookies, which can be spoofed by anyone.
 * Always use supabase.auth.getUser() to protect pages and user data.
 * Never trust supabase.auth.getSession() inside server code such as middleware. It isn't guaranteed to revalidate the Auth token.
 * It's safe to trust getUser() because it sends a request to the Supabase Auth server every time to revalidate the Auth token.
 **/

export const checkServerUserAuth = async (): Promise<AuthCheck> => {
  const supabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) {
    return { user: null, error }
  }
  if (!user) {
    return {
      user: null,
      error: new APIError({
        code: 'unauthorized',
        message: 'No user found',
      }),
    }
  }
  return { user, error: null }
}

/**
 * serverRedirectToHomeIfAuthorized can be used in server components
 * to redirect to the users home page if the user is authorized
 **/
export const serverRedirectToHomeIfAuthorized = async () => {
  const { user } = await checkServerUserAuth()
  if (isClient(user)) {
    redirect(`/clients/${user?.id}`)
  }
  if (user) {
    redirect('/home')
  }
}

export const redirectClientHomePage = async () => {
  const { user } = await checkServerUserAuth()
  if (user) {
    redirect(`/clients/${user?.id}/home`)
  }
}
