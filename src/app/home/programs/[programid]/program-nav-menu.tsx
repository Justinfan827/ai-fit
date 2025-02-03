'use client'

import Link from 'next/link'

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { usePathname } from 'next/navigation'

export function ProgramNavigationMenu({ programId }: { programId: string }) {
  const pathname = usePathname()
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href={`/home/programs/${programId}`} legacyBehavior passHref>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle()}
              active={pathname === `/home/programs/${programId}`}
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
              className={navigationMenuTriggerStyle()}
              active={pathname === `/home/programs/${programId}/workouts`}
            >
              Workouts
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
