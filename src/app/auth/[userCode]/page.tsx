import { UnauthHeader } from '@/components/header'
import { Icons } from '@/components/icons'
import { signInUserCode } from '@/lib/supabase/server/database.operations.queries'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

export default async function ClientPage({
  params,
}: {
  params: Promise<{ userCode: string }>
}) {
  const userCode = (await params).userCode
  return (
    <Suspense key={userCode} fallback={<PageFallback />}>
      <ClientLoading userCode={userCode} />
    </Suspense>
  )
}

function PageFallback() {
  return (
    <div>
      <UnauthHeader />
      <Icons.spinner className="h-8 w-8 animate-spin" />
      Loading...
    </div>
  )
}

type Props = {
  userCode: string
}
async function ClientLoading({ userCode }: Props) {
  const { data, error } = await signInUserCode({ code: userCode })
  if (error) {
    return (
      <div>
        <UnauthHeader />
        An invalid link was used
      </div>
    )
  }
  redirect(`/clients/${data.userId}`)
}
