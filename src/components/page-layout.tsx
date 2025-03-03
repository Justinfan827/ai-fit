import React from 'react'

interface PageLayoutProps {
  children: React.ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="w-full">
      {children}
    </div>
  )
}

export function PageContent({ children }: PageLayoutProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  )
}

export function PageSection({ children, className }: PageLayoutProps & { className?: string }) {
  return (
    <div className={`space-y-4 p-4 ${className}`}>
      {children}
    </div>
  )
} 