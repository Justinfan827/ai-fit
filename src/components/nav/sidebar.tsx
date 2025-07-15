"use client"
import { Home, SquareLibrary, User } from "lucide-react"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  // {
  //   title: 'Search',
  //   url: '#',
  //   icon: Search,
  // },
  {
    title: "Home",
    url: "/home",
    matchRegex: "^/home$",
    icon: Home,
  },
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
}
export function AppSidebar({ hideOnURLs = [] }: AppSidebarProps) {
  const path = usePathname()
  // check if the current path is in the hideOnURLs array

  if (hideOnURLs.includes(path)) {
    return null
  }

  return (
    <Sidebar collapsible="icon">
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
                        <item.icon />
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
    </Sidebar>
  )
}
