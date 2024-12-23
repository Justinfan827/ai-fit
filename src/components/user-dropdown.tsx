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
import { getCurrentUser } from '@/lib/supabase/server/database.operations.queries'
import { capitalizeFirstLetter } from '@/lib/utils'

export async function Usermenu() {
  const { data, error } = await getCurrentUser()
  if (error) {
    return null
  }
  const firstName = data.metadata.firstName || ''
  const lastName = data.metadata.lastName || ''
  const firstLetter = (
    firstName.charAt(0) ||
    data.sbUser.email?.charAt(0) ||
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
              {data.sbUser.email}
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
