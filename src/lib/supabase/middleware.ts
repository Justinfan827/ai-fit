import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { getSupabasePublishableKey, getSupabaseURL } from "./utils"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    getSupabaseURL(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          supabaseResponse = NextResponse.next({
            request,
          })
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options)
          }
        },
      },
    }
  )
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims
  const pathName = request.nextUrl.pathname
  if (
    pathName !== "/" &&
    !user &&
    !pathName.startsWith("/login") &&
    !pathName.startsWith("/api/auth/callback") &&
    !pathName.startsWith("/api/status")
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }
  return supabaseResponse
}
