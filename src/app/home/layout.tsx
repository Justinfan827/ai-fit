import StickyNavbar from '@/components/navbar'
import SignOutButton from '@/components/sign-out-button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createServerClient } from '@/lib/supabase/create-server-client'
import { getCurrentUser } from '@/lib/supabase/server/database.operations.queries'
import SupabaseProvider from '@/lib/supabase/use-supabase'

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const client = await createServerClient()
  const { data: user, error } = await getCurrentUser(client)
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
                    Looks like you're an invalid user or your session has
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
    <>
      <SupabaseProvider user={user}>
        <main>{children}</main>
      </SupabaseProvider>
    </>
  )
}
