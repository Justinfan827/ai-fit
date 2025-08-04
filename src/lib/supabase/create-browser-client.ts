import { createBrowserClient as createBrowserClientSupabase } from "@supabase/ssr"
import type { Database } from "./database.types"

/**
 * Create a supabase DB client from the browser
 */
export function createBrowserClient() {
  return createBrowserClientSupabase<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
