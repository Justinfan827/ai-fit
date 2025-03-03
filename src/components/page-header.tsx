import { Tp } from '@/components/typography'
import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="border-b border-b-neutral-800 p-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between py-6 sm:px-6 lg:px-8 lg:py-6">
        <div>
          <Tp className="text-2xl tracking-wide" variant="h2">
            {title}
          </Tp>
          {subtitle && (
            <p className="leading-none text-neutral-500">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="space-x-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
} 