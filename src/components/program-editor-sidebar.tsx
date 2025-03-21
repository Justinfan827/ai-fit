import * as React from 'react'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { IntakeForm } from './forms/ClientIntakeForm'
import { VersionSwitcher } from './version-switcher'

const versions = ['coach profile 1', 'coach profile 2']

export function ProgramEditorSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher versions={versions} defaultVersion="coach profile 1" />
      </SidebarHeader>
      <SidebarContent>
        <div className="px-8 py-4">
          <IntakeForm />
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
