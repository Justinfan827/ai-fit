'use client'

import * as React from 'react'

import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type PasswordInputProps = React.ComponentProps<'input'>

const PasswordInput: React.FC<PasswordInputProps> = ({
  className,
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className="relative">
      <Input
        type={showPassword ? 'text' : 'password'}
        className={cn('pr-10', className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setShowPassword((prev) => !prev)}
        disabled={props.value === '' || props.disabled}
      >
        {showPassword ? (
          <Icons.hide className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Icons.view className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="sr-only">
          {showPassword ? 'Hide password' : 'Show password'}
        </span>
      </Button>
    </div>
  )
}

export { PasswordInput }
