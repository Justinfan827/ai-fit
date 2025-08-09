import { AppSidebar } from "@/components/nav/sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getCachedUserT } from "@/lib/supabase/server/database.operations.queries"

export default async function ClientsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCachedUserT()
  return (
    <SidebarProvider
      defaultOpen={true}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 16)",
        } as React.CSSProperties
      }
    >
      <AppSidebar user={user} />
      <SidebarInset> {children} </SidebarInset>
    </SidebarProvider>
  )
}
