import { NextResponse } from 'next/server'

import { createServerClient } from '@/lib/supabase/create-server-client'
import { getCurrentUser } from '@/lib/supabase/server/database.operations.queries'
import { isClient } from '@/lib/supabase/utils'
import { EmailOtpType } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

/**
 * This endpoint handles the code exchange in the supabase auth flow:
 * https://supabase.com/docs/guides/auth/auth-helpers/nextjs#code-exchange-route
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  // Handle errors sent via query params
  // from the supabase auth server. E.g. expired magic link.
  const err = searchParams.get('error')
  if (err) {
    return redirectToSigninWithErrors(request.nextUrl, {
      errorTitle: 'Supabase auth server error',
      errorCode: 'supabase_auth_server_error',
      errorDescription:
        'Supabase called auth callback with error query parameter',
    })
  }

  const original = searchParams.get('original_path')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType

  if (!token_hash || !type) {
    return redirectToSigninWithErrors(request.nextUrl, {
      errorTitle: 'Missing token hash or type',
      errorCode: 'missing_token_hash_or_type',
      errorDescription: 'Missing token hash or type in the query params.',
    })
  }
  const supabase = await createServerClient()
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  })
  if (error) {
    return redirectToSigninWithErrors(request.nextUrl, {
      errorTitle: error.code,
      errorCode: error.code || 'unknown_supabase_error',
      errorDescription: error.message,
    })
  }

  const { data, error: userErr } = await getCurrentUser()
  if (userErr) {
    return redirectToSigninWithErrors(request.nextUrl, {
      errorTitle: 'Error fetching user',
      errorCode: 'error_fetching_user',
      errorDescription: userErr.message,
    })
  }
  // redirect to the appropriate page based on user type
  if (isClient(data.sbUser)) {
    return NextResponse.redirect(`${origin}/clients/${data.sbUser.id}`)
  }
  return NextResponse.redirect(`${origin}/home`)
}

type errorSearchParams = {
  errorTitle: string
  errorCode: string
  errorDescription: string
}

function redirectToSigninWithErrors(
  requestUrl: URL,
  { errorTitle, errorCode, errorDescription }: errorSearchParams
) {
  requestUrl.searchParams.set('error', errorTitle)
  requestUrl.searchParams.set('error_code', errorCode)
  requestUrl.searchParams.set('error_description', errorDescription)
  const redirectErrorURL =
    `${requestUrl.origin}/signin?` + requestUrl.searchParams

  return NextResponse.redirect(redirectErrorURL)
}
