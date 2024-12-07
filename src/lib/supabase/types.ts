import { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

export type DbResult<T> = T extends PromiseLike<infer U> ? U : never
export type DbResultOk<T> =
  T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never
export type DbResultErr = PostgrestError

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type DBClient = SupabaseClient<Database>
