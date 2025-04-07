'use client'

import { buttonVariants } from '@/components/ui/button'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { VariantProps } from 'class-variance-authority'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { toast } from 'sonner'
import LoadingButton from './loading-button'

export interface SignOutButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export default function SignOutButton({
  className,
  variant = 'ghost',
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
    router.push('/login')
  }
  return (
    <LoadingButton
      isLoading={isLoading}
      className={className}
      variant={variant}
      onClick={handleOnClick}
    >
      Sign out
    </LoadingButton>
  )
}
