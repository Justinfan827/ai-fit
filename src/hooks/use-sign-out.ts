"use client"

import { useClerk } from "@clerk/tanstack-react-start"
import { useState } from "react"
import { toast } from "sonner"

export const useSignOut = () => {
  const [isPending, setIsPending] = useState(false)
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    setIsPending(true)
    try {
      await signOut()
      // Navigation handled by Clerk's afterSignOutUrl config
      window.location.href = "/login"
    } catch {
      toast.error("Something went wrong. Please try again later.")
    } finally {
      setIsPending(false)
    }
  }

  return {
    signOut: handleSignOut,
    isPending,
  }
}
