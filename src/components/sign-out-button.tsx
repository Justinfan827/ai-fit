'use client'

import { buttonVariants } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { VariantProps } from 'class-variance-authority'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
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
  const { supabase, user } = useSupabase()
  const { toast } = useToast()
  if (!user) return null
  const handleOnClick = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        variant: 'destructive',
        description: error.message,
      })
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
