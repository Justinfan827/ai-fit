'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ReactNode } from 'react'

import { usePathname } from 'next/navigation'

interface NavbarLinkProps {
  href: string
  matchOn?: string
  children?: ReactNode
}

interface NavLink {
  href: string
  name: string
  matchOn?: string
}

export default function NavbarLinks() {
  const allLinks: NavLink[] = [
    {
      href: '/home/programs',
      name: 'Programs',
    },
    {
      href: '/home',
      name: 'Home',
    },
  ]
  return (
    <div className="flex gap-4">
      {allLinks.map(({ href, name, matchOn }) => (
        <NavbarLink key={href} href={href} matchOn={matchOn}>
          {name}
        </NavbarLink>
      ))}
    </div>
  )
}

export function NavbarLink({ href, children, matchOn }: NavbarLinkProps) {
  const path = usePathname()
  return (
    <Link
      key={href}
      href={href}
      className={cn(
        path === href || (!!matchOn && path.startsWith(matchOn))
          ? 'border-purple-400 text-purple-400'
          : 'text-primary-60 border-transparent text-primary hover:border-purple-400 hover:text-purple-400',
        // bottom padding is adjusted by 2 pixels to compensate for the bottom border pushing
        // up content
        'whitespace-nowrap border-b-2 px-1 pb-[15px] pt-[17px] text-sm font-medium leading-none'
      )}
    >
      {children}
    </Link>
  )
}
