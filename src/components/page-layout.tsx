import React from 'react'
import { Tp } from './typography'

interface PageLayoutProps {
  children: React.ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  return <div className="w-full">{children}</div>
}

export function PageContent({ children }: PageLayoutProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
  )
}

export function PageSectionHeader({ children }: { children: React.ReactNode }) {
  return <Tp variant="h3">{children}</Tp>
}

export function PageSection({
  children,
  className,
}: PageLayoutProps & { className?: string }) {
  return <div className={`space-y-4 p-4 ${className}`}>{children}</div>
}
