import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"
import { getSupabaseURL } from "./utils"

export default function createAdminClient() {
  return createClient<Database>(
    getSupabaseURL(),
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
