import { User } from '@supabase/supabase-js'

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
import { createServerClient } from '@/lib/supabase/create-server-client'
import { getUserFirstLast } from '@/lib/supabase/server/database.operations.queries'
import { capitalizeFirstLetter } from '@/lib/utils'
import NavbarLinks from './navbar-client'

type Props = {
  user: User
}
export default async function Navbar({ user }: Props) {
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-gray-200 bg-background">
      <div className="-mb-px flex items-center justify-between px-4">
        <div className="flex items-center gap-x-8">
          <NavbarLinks />
        </div>
        <div className="flex items-center space-x-4">
          <NavUserDropdown user={user} />
        </div>
      </div>
    </nav>
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
