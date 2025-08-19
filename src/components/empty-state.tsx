import Link from "next/link"
import type React from "react"
import type { ReactNode } from "react"
import { Logo } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import LoadingButton from "./loading-button"

// Type definitions
interface EmptyStateCardProps {
  title: string
  subtitle: string
  buttonText?: string
  buttonHref?: string
  buttonAction?: () => void
  isActionPending?: boolean
  actionComponent?: ReactNode
}

interface EmptyStateTextProps {
  title: string
  children: ReactNode
}

interface EmptyStateContentProps {
  children: ReactNode
}

interface EmptyStateActionProps {
  link: string
  linkText: string
}

function EmptyStateCard({
  title,
  subtitle,
  buttonText,
  buttonHref,
  buttonAction,
  actionComponent,
  isActionPending,
  className,
  ...props
}: EmptyStateCardProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 rounded-md border border-neutral-800 py-8",
        className
      )}
      id="empty-state-card"
      {...props}
    >
      <div className="rounded-md border border-neutral-800 p-4">
        <Logo />
      </div>
      <div className="flex flex-col items-center justify-center gap-2">
        <p className="text-md">{title}</p>
        <div className="flex max-w-[250px] justify-center text-center">
          <p className="text-neutral-400 text-sm">{subtitle}</p>
        </div>
      </div>

      {buttonHref && buttonText && (
        <div className="flex w-full justify-center pt-2">
          <Button asChild variant="outline">
            <Link href={buttonHref}>{buttonText}</Link>
          </Button>
        </div>
      )}
      {buttonAction && buttonText && (
        <LoadingButton
          isLoading={!!isActionPending}
          onClick={buttonAction}
          variant="outline"
        >
          {buttonText}
        </LoadingButton>
      )}
      {actionComponent && actionComponent}
    </div>
  )
}

const EmptyStateLogo: React.FC = () => (
  <div className="rounded-md border border-neutral-800 p-4">
    <Logo />
  </div>
)

const EmptyStateText: React.FC<EmptyStateTextProps> = ({ title, children }) => (
  <div className="flex flex-col items-center justify-center gap-2">
    <p className="font-bold text-md">{title}</p>
    {children}
  </div>
)

const EmptyStateContent: React.FC<EmptyStateContentProps> = ({ children }) => (
  <div className="flex w-2/3 justify-center text-center">
    <p className="text-neutral-400 text-sm">{children}</p>
  </div>
)

const EmptyStateAction: React.FC<EmptyStateActionProps> = ({
  link,
  linkText,
}) => (
  <div className="flex w-full justify-center pt-2">
    <Button asChild variant="outline">
      <Link href={link}>{linkText}</Link>
    </Button>
  </div>
)

export {
  EmptyStateAction,
  EmptyStateCard,
  EmptyStateContent,
  EmptyStateLogo,
  EmptyStateText,
}
