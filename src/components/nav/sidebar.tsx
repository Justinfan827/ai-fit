"use client"
import { ChevronLeft, Settings, SquareLibrary, User } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { NavUser } from "@/components/nav-user"
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

// Menu items.
const mainItems = [
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

const settingsItems = [
  // TODO: Create general settings page
  // {
  //   title: "General",
  //   url: "/home/settings/general",
  //   matchRegex: "^/home/settings/general",
  //   icon: Settings,
  // },
  {
    title: "Exercises",
    url: "/home/settings/exercises",
    matchRegex: "^/home/settings/exercises",
    icon: SquareLibrary,
  },
]

type AppSidebarProps = {
  hideOnURLs?: string[]
  user: CurrentUser
}
const userSettingsRegex = /\/settings(\/|$)/
export function AppSidebar({ hideOnURLs = [], user }: AppSidebarProps) {
  const path = usePathname()
  const router = useRouter()

  if (hideOnURLs.some((url) => new RegExp(url).test(path))) {
    return null
  }
  const isUserSettingsPage = userSettingsRegex.test(path)

  const handleBackClick = () => {
    router.push("/home/clients")
  }

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
        <div className="relative h-full overflow-hidden">
          {/* Main sidebar content */}
          <div
            className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
              isUserSettingsPage ? "-translate-x-full" : "translate-x-0"
            }`}
          >
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainItems.map((item) => {
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
          </div>

          {/* Settings sidebar content */}
          <div
            className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
              isUserSettingsPage ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <button
                        aria-label="Back"
                        className=""
                        onClick={handleBackClick}
                        type="button"
                      >
                        <ChevronLeft className="text-sidebar-accent-foreground/70 transition-colors duration-100 ease-linear group-hover/menu-item:text-sidebar-accent-foreground" />
                        <span>Back</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {settingsItems.map((item) => {
                    const isActive = new RegExp(item.matchRegex).test(path)
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.url}>
                            <item.icon className="text-sidebar-accent-foreground/70 transition-colors duration-100 ease-linear group-hover/menu-item:text-sidebar-accent-foreground group-has-data-[active=true]/menu-item:font-medium group-has-data-[active=true]/menu-item:text-sidebar-accent-foreground" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        </div>
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
