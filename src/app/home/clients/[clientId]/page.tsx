import { Logo } from '@/components/icons'
import { Tp } from '@/components/typography'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  getAllCurrentUserUnassignedPrograms,
  getClientUserWithPrograms,
} from '@/lib/supabase/server/database.operations.queries'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { AssignProgramSidesheet } from './assign-program-sidesheet'

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const clientId = (await params).clientId
  const { data, error } = await getClientUserWithPrograms(clientId)
  if (error) {
    return <div>error: {error.message}</div>
  }

  const { data: programs, error: programsError } =
    await getAllCurrentUserUnassignedPrograms()
  if (programsError) {
    return <div>error: {programsError.message}</div>
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
          <div className="mx-auto flex max-w-7xl items-center justify-between sm:px-6 sm:py-6 lg:px-8 lg:py-6">
            <div>
              <Tp className="text-2xl tracking-wide" variant="h2">
                Client: {data.firstName} {data.lastName}
              </Tp>
              <p className="leading-none text-neutral-500">{data.email}</p>
            </div>
            <AssignProgramSidesheet clientId={clientId} programs={programs} />
          </div>
        </div>
        <div id="programs-container" className="space-y-4 p-4">
          <Tp className="text-2xl tracking-wide">Assigned Programs</Tp>
          {data.programs.map((program, idx) => (
            <Link
              href={`/home/programs/${program.id}`}
              key={program.id}
              className={cn(
                'flex border-x border-b border-neutral-700 px-4 py-4',
                idx === 0 && 'rounded-t-sm border-t',
                idx === data.programs.length - 1 && 'rounded-b-sm border-b'
              )}
            >
              {program.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
