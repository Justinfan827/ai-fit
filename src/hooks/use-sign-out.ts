"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useSupabase } from "@/lib/supabase/use-supabase"

export const useSignOut = () => {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const { supabase } = useSupabase()

  const signOut = async () => {
    setIsPending(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      // Navigate to login page after successful sign out
      router.push("/login")
    } catch {
      toast.error("Something went wrong. Please try again later.")
    } finally {
      setIsPending(false)
    }
  }

  return {
    signOut,
    isPending,
  }
}
