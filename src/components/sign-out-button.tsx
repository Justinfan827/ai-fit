"use client"

import type { VariantProps } from "class-variance-authority"
import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"
import { toast } from "sonner"
import type { buttonVariants } from "@/components/ui/button"
import { useSupabase } from "@/lib/supabase/use-supabase"
import LoadingButton from "./loading-button"

export interface SignOutButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export default function SignOutButton({
  className,
  variant = "ghost",
}: SignOutButtonProps) {
  const [isLoading, setLoading] = useState(false)
  const router = useRouter()
  const { supabase } = useSupabase()
  const handleOnClick = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast(error.message)
    }
    router.push("/login")
  }
  return (
    <LoadingButton
      className={className}
      isLoading={isLoading}
      onClick={handleOnClick}
      variant={variant}
    >
      Sign out
    </LoadingButton>
  )
}
