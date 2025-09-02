"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

export function ProgramNavigationMenu({ programId }: { programId: string }) {
  const pathname = usePathname()
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href={`/home/programs/${programId}`} passHref>
            <NavigationMenuLink
              active={pathname === `/home/programs/${programId}`}
              className={navigationMenuTriggerStyle()}
            >
              Editor
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link
            href={`/home/programs/${programId}/workouts`}
            legacyBehavior
            passHref
          >
            <NavigationMenuLink
              active={pathname === `/home/programs/${programId}/workouts`}
              className={navigationMenuTriggerStyle()}
            >
              Workouts
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
