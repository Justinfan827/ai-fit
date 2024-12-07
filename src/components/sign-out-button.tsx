'use client'

import { Button, buttonVariants } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { VariantProps } from 'class-variance-authority'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { Icons } from './icons'

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
    router.push('/signin')
  }
  return (
    <Button className={className} variant={variant} onClick={handleOnClick}>
      {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
      Sign out
    </Button>
  )
}
