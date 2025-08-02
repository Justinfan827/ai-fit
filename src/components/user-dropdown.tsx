import SignOutButton from "@/components/sign-out-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { CurrentUser } from "@/lib/supabase/server/database.operations.queries"
import { capitalizeFirstLetter } from "@/lib/utils"

export function UserDropdown({ user }: { user: CurrentUser }) {
  const firstName = user.metadata.firstName || "Tester"
  const lastName = user.metadata.lastName || "Dummy"
  const firstLetter = firstName.charAt(0).toUpperCase()
  const lastLetter = lastName.charAt(0).toUpperCase()
  return (
    // If modal is not set to false, on some browsers the scrollbar
    // will disappear on pages when the dropdown is opened
    // https://github.com/radix-ui/primitives/discussions/1100
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button className="relative h-8 w-8 rounded-full" variant="ghost">
          <Avatar className="h-9 w-9">
            {/* TODO: image of user */}
            {/* <AvatarImage src="" alt="" /> */}
            <AvatarFallback className="bg-ansaAvatar text-ansaAvatar-foreground">
              {`${firstLetter}${lastLetter}`}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="font-medium text-sm leading-none">
              {capitalizeFirstLetter(firstName)}{" "}
              {capitalizeFirstLetter(lastName)}
            </p>
            <p className="text-muted-foreground text-xs leading-none">
              {user.sbUser.email}
            </p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            {firstName && lastName && (
              <p className="font-medium text-sm leading-none">
                {capitalizeFirstLetter(firstName)}{" "}
                {capitalizeFirstLetter(lastName)}
              </p>
            )}
            <p className="text-muted-foreground text-xs leading-none">
              {user.sbUser.email}
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
