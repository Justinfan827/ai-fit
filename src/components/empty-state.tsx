import Link from 'next/link'
import React, { ReactNode } from 'react'
import { Logo } from './icons'
import { Button } from './ui/button'

// Type definitions
interface EmptyStateCardProps {
  children: ReactNode
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

const EmptyStateCard: React.FC<EmptyStateCardProps> = ({ children }) => {
  return (
    <div
      id="empty-state-card"
      className="flex w-full flex-col items-center justify-center gap-6 rounded-md border border-neutral-800 py-8"
    >
      {children}
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
    <p className="text-md font-bold">{title}</p>
    {children}
  </div>
)

const EmptyStateContent: React.FC<EmptyStateContentProps> = ({ children }) => (
  <div className="flex w-2/3 justify-center text-center">
    <p className="text-sm text-neutral-400">{children}</p>
  </div>
)

const EmptyStateAction: React.FC<EmptyStateActionProps> = ({
  link,
  linkText,
}) => (
  <div className="flex w-full justify-center pt-2">
    <Button variant="outline" asChild>
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
