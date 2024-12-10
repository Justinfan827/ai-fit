import React from 'react'
import { ProgramNavigationMenu } from './program-nav-menu'

export default async function ProgramLayout({
  params,
  children,
}: {
  params: Promise<{ programid: string }>
  children: React.ReactNode
}) {
  const programid = (await params).programid
  return (
    <div className="debug w-full">
      <div className='px-4'>
        <ProgramNavigationMenu programId={programid} />
      </div>
      {children}
    </div>
  )
}
