import { createBrowserClient as createBrowserClientSupabase } from "@supabase/ssr"
import type { Database } from "./database.types"
import { getSupabasePublishableKey, getSupabaseURL } from "./utils"

/**
 * Create a supabase DB client from the browser
 */
export function createBrowserClient() {
  return createBrowserClientSupabase<Database>(
    getSupabaseURL(),
    getSupabasePublishableKey()
  )
}
