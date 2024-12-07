import { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { createServerClient } from '../create-server-client'

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
    return { user: null, error: new Error('No user found') }
  }
  return { user, error: null }
}

/**
 * serverRedirectToHomeIfAuthorized can be used in server components
 * to redirect to the users home page if the user is authorized
 **/
export const serverRedirectToHomeIfAuthorized = async () => {
  const supabase = await createServerClient()
  const { user, error } = await checkServerUserAuth()
  if (user) {
    redirect('/home')
  }
  return { supabase, error }
}
