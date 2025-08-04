import { createServerClient as createClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseConfig } from "../env"
import type { Database } from "./database.types"

export async function createServerClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseConfig()

  return createClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
