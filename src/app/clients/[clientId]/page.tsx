import { ClientProgramWorkoutList } from '@/components/client-program-workout-list'
import { Logo } from '@/components/icons'
import { Tp } from '@/components/typography'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import NumberTicker from '@/components/ui/number-ticker'
import { Ping } from '@/components/ui/ping'
import { Separator } from '@/components/ui/separator'
import {
  getClientActiveProgram,
  getCurrentUser,
} from '@/lib/supabase/server/database.operations.queries'

/*
 * Here I am logged in as the client
 */
export default async function ClientHomePage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { data: user, error: userErr } = await getCurrentUser()
  if (userErr) {
    return <div>error: {userErr.message}</div>
  }
  const { data, error } = await getClientActiveProgram()
  if (error) {
    return <div>error: {error.message}</div>
  }
  return (
    <div>
      <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4">
        <Logo />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbPage>Home</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div id="home content">
        <div className="border-b border-b-neutral-800 p-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between py-2 sm:px-6 sm:py-6 lg:px-8 lg:py-6">
            <div>
              <Tp className="text-xl tracking-wide" variant="h2">
                Welcome, {user.metadata.firstName}
              </Tp>
              <p className="text-sm leading-none text-neutral-600">
                {user.sbUser.email}
              </p>
            </div>
          </div>
        </div>
        <div className="px-4">
          <div
            id="programs-container"
            className="mx-auto max-w-7xl space-y-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-6"
          >
            <div>
              <Tp className="text-xl tracking-wide" variant="h2">
                Current program
              </Tp>
              <p className="text-sm leading-none text-neutral-600">
                {data.name}
              </p>
            </div>
            <div id="stats">
              <Separator className="" />
              <div
                id="counts"
                className="flex items-center justify-evenly gap-4 p-2 py-4"
              >
                <div className="" id="completed-count">
                  <p className="text-sm leading-none text-neutral-600">
                    Workouts completed
                  </p>
                  <div className="flex items-center gap-4">
                    <Ping className="" variant="green" />
                    <NumberTicker className="text-xl" value={1} />
                  </div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div id="weeks-completed-count">
                  <p className="text-sm leading-none text-neutral-600">
                    Weeks completed
                  </p>
                  <div className="flex items-center gap-4">
                    <Ping className="" variant="green" />
                    <NumberTicker className="text-xl" value={1} />
                  </div>
                </div>
              </div>
              <Separator className="" />
            </div>
            <ClientProgramWorkoutList
              programId={data.id}
              clientId={user.sbUser.id}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
