import { createBrowserClient as createBrowserClientSupabase } from "@supabase/ssr"
import { getSupabaseConfig } from "../env"
import type { Database } from "./database.types"

/**
 * Create a supabase DB client from the browser
 */
export function createBrowserClient() {
  const { url, anonKey } = getSupabaseConfig()

  return createBrowserClientSupabase<Database>(url, anonKey)
}
