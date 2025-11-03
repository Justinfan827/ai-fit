"use client"

import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export const useSignOut = () => {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    setIsPending(true)
    try {
      await signOut()
      // Navigate to login page after successful sign out
      router.push("/login")
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
