"use client"

import type { SupabaseClient, User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"
import { createBrowserClient } from "./create-browser-client"
import type { Database } from "./database.types"

type MaybeUser = User | null

interface BaseCtx {
  supabase: SupabaseClient<Database>
}
interface SupabaseContext extends BaseCtx {
  user: MaybeUser
}
interface DefSupabaseContext extends BaseCtx {
  user: User
}

const Context = createContext<SupabaseContext | undefined>(undefined)

/**
 * SupabaseProvider is how we expose the supabase client in client components
 **/
export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode

  user?: MaybeUser
}) {
  const router = useRouter()
  const [user, setUser] = useState<MaybeUser>(null)
  const [supabase] = useState(() => createBrowserClient())
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      // refresh server component data
      setUser(session?.user ?? null)
      router.refresh()
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])
  return (
    <Context.Provider value={{ supabase, user }}>
      <>{children}</>
    </Context.Provider>
  )
}
export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider")
  }
  return context
}

export const useSupabaseAuthed = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider")
  }
  if (!context.user) {
    throw new Error("User not authenticated")
  }
  return context as DefSupabaseContext
}
