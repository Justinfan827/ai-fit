import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import * as React from 'react'

import SignOutButton from '@/components/sign-out-button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { createServerClient } from '@/lib/supabase/create-server-client'
import {
  getCurrentUser,
  getUserFirstLast,
} from '@/lib/supabase/server/database.operations.queries'
import SupabaseProvider from '@/lib/supabase/use-supabase'
import { capitalizeFirstLetter, cn } from '@/lib/utils'
import { Logo } from './icons'

export default async function Navbar() {
  const client = await createServerClient()
  const { data: user, error } = await getCurrentUser() // TODO: suspense and fallback
  if (error) {
    return (
      <header className="sticky top-0 z-40 flex w-full items-center justify-start gap-8 border-b border-neutral-800 bg-background px-4 py-2">
        <Logo />
        <nav className="flex h-10 w-full items-center justify-between"></nav>
      </header>
    )
  }
  return (
    <header className="sticky top-0 z-40 flex w-full items-center justify-start gap-8 border-b border-neutral-800 bg-background px-4 py-2">
      <Logo />
      <nav className="flex h-10 w-full items-center justify-between">
        <NavbarNew />
        <SupabaseProvider>
          <NavUserDropdown user={user} />
        </SupabaseProvider>
      </nav>
    </header>
  )
}

interface NavbarDropdownProps {
  user: User
}

export async function NavUserDropdown({ user }: NavbarDropdownProps) {
  const supabase = await createServerClient()
  const { data: userData, error } = await getUserFirstLast(supabase, user)
  if (error) {
    throw new Error(
      `Error fetching user first and last ${error.name}: ${error.message}`
    )
  }
  const firstName = userData?.first_name || ''
  const lastName = userData?.last_name || ''
  const firstLetter = (
    firstName.charAt(0) ||
    user.email?.charAt(0) ||
    'A'
  ).toUpperCase()
  const lastLetter = (lastName.charAt(0) || '').toUpperCase()
  return (
    // If modal is not set to false, on some browsers the scrollbar
    // will disappear on pages when the dropdown is opened
    // https://github.com/radix-ui/primitives/discussions/1100
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            {/* TODO: image of user */}
            {/* <AvatarImage src="" alt="" /> */}
            <AvatarFallback className="bg-ansaAvatar text-ansaAvatar-foreground">
              {`${firstLetter}${lastLetter}`}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            {firstName && lastName && (
              <p className="text-sm font-medium leading-none">
                {capitalizeFirstLetter(firstName)}{' '}
                {capitalizeFirstLetter(lastName)}
              </p>
            )}
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-0">
          <SignOutButton className="w-full justify-start" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NavbarNew() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href="/home" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Home
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href="/home/programs" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Programs
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'>
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = 'ListItem'
