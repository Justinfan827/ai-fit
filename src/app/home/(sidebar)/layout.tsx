import { AppSidebar } from "@/components/nav/sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getCachedUserT } from "@/lib/supabase/server/database.operations.queries"
import SupabaseProvider from "@/lib/supabase/use-supabase"

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCachedUserT()
  return (
    <SupabaseProvider user={user}>
      <SidebarProvider
        defaultOpen={true}
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 16)",
            "--inset-height": "calc(var(--spacing) * 2)",
          } as React.CSSProperties
        }
      >
        <AppSidebar user={user} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </SupabaseProvider>
  )
}
