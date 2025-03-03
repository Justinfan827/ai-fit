import { AppSidebar } from '@/components/nav/sidebar'
import SignOutButton from '@/components/sign-out-button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SidebarProvider } from '@/components/ui/sidebar'
import AIProgramProvider from '@/hooks/use-workout'
import { getCurrentUser } from '@/lib/supabase/server/database.operations.queries'
import SupabaseProvider from '@/lib/supabase/use-supabase'

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: user, error } = await getCurrentUser()

  if (error) {
    return (
      <SupabaseProvider user={user}>
        <main>
          <section className="flex h-screen items-start justify-center pt-10">
            <div className="p-4 sm:max-w-[600px]">
              <Card className="p-4">
                <CardHeader className="">
                  <CardTitle className="pb-4 text-2xl">WOOPS</CardTitle>
                  <CardDescription>
                    Looks like you&apos;re an invalid user or your session has
                    expired.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-end">
                  <SignOutButton variant="default">Sign Out</SignOutButton>
                </CardFooter>
              </Card>
            </div>
          </section>
        </main>
      </SupabaseProvider>
    )
  }
  return (
    <AIProgramProvider>
      <SupabaseProvider user={user.sbUser}>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
          <main className="w-full">{children}</main>
        </SidebarProvider>
      </SupabaseProvider>
    </AIProgramProvider>
  )
}
