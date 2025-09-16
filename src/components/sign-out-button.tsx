"use client"

import type { VariantProps } from "class-variance-authority"
import type React from "react"
import type { buttonVariants } from "@/components/ui/button"
import { useSignOut } from "@/hooks/use-sign-out"
import LoadingButton from "./loading-button"

export interface SignOutButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export default function SignOutButton({
  className,
  variant = "ghost",
  size,
  type = "button",
  children,
  ...rest
}: SignOutButtonProps) {
  const { signOut, isPending } = useSignOut()

  const handleOnClick = async (_: React.MouseEvent) => {
    await signOut()
  }

  return (
    <LoadingButton
      className={className}
      isLoading={isPending}
      onClick={handleOnClick}
      size={size}
      type={type}
      variant={variant}
      {...rest}
    >
      {children ?? "Sign out"}
    </LoadingButton>
  )
}
