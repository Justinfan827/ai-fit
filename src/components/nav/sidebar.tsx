"use client"
import { SquareLibrary, User } from "lucide-react"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { CurrentUser } from "@/lib/supabase/server/database.operations.queries"
import { NavUser } from "../nav-user"

// Menu items.
const items = [
  // {
  //   title: 'Search',
  //   url: '#',
  //   icon: Search,
  // },
  {
    title: "Clients",
    url: "/home/clients",
    matchRegex: "^/home/clients",
    icon: User,
  },
  {
    title: "Programs",
    url: "/home/programs",
    matchRegex: "^/home/programs",
    icon: SquareLibrary,
  },
]

type AppSidebarProps = {
  hideOnURLs?: string[]
  user: CurrentUser
}
const userSettingsRegex = /\/settings\//
export function AppSidebar({ hideOnURLs = [], user }: AppSidebarProps) {
  const path = usePathname()

  if (hideOnURLs.some((url) => new RegExp(url).test(path))) {
    return null
  }
  const isUserSettingsPage = userSettingsRegex.test(path)
  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/home">
                <span className="font-semibold text-base">AI Fit.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                // check if path matches the item url
                // if it does, set the item to active
                const isActive = new RegExp(item.matchRegex).test(path)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <a href={item.url}>
                        <item.icon className="text-sidebar-accent-foreground/70 transition-colors duration-100 ease-linear group-hover/menu-item:text-sidebar-accent-foreground group-has-data-[active=true]/menu-item:font-medium group-has-data-[active=true]/menu-item:text-sidebar-accent-foreground" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <NavUser
              user={{
                name: `${user.firstName} ${user.lastName}`,
                email: user.email || "",
                avatarURL: user.avatarURL || "",
              }}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
