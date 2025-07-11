"use client"

import * as React from "react"

import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type PasswordInputProps = React.ComponentProps<"input">

const PasswordInput: React.FC<PasswordInputProps> = ({
  className,
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className="relative">
      <Input
        className={cn("pr-10", className)}
        type={showPassword ? "text" : "password"}
        {...props}
      />
      <Button
        className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
        disabled={props.value === "" || props.disabled}
        onClick={() => setShowPassword((prev) => !prev)}
        size="sm"
        type="button"
        variant="ghost"
      >
        {showPassword ? (
          <Icons.hide aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Icons.view aria-hidden="true" className="h-4 w-4" />
        )}
        <span className="sr-only">
          {showPassword ? "Hide password" : "Show password"}
        </span>
      </Button>
    </div>
  )
}

export { PasswordInput }
