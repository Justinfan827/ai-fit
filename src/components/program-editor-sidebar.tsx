'use client'

import * as React from 'react'

import { generateClientProgramAction } from '@/actions/generate-client-program'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { ClientHomePage } from '@/lib/domain/clients'
import { Exercise } from '@/lib/domain/workouts'
import { useTransition } from 'react'
import { toast } from 'sonner'
import {
  ProgramParametersForm,
  ProgramParametersFormType,
} from './forms/ProgramParametersForm'
import { Icons } from './icons'
import LoadingButton from './loading-button'
import { Tp } from './typography'
import { Card, CardHeader } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'

interface ProgramEditorSidebarProps
  extends React.ComponentProps<typeof Sidebar> {
  trainerId: string
  exercises: Exercise[]
  client: ClientHomePage
}

export function ProgramEditorSidebar({
  exercises,
  trainerId,
  client,
  ...props
}: ProgramEditorSidebarProps) {
  const [isPending, startTransition] = useTransition()
  const basicInfo = [
    { name: 'Age', value: client.age },
    { name: 'Weight', value: client.weightKg },
    { name: 'Height', value: client.heightCm },
    {
      name: 'Lifetime lifting experience',
      value: client.liftingExperienceMonths,
    },
    { name: 'Gender', value: client.gender },
  ]
  const handleOnSubmit = (formData: ProgramParametersFormType) => {
    startTransition(async () => {
      const { data, error } = await generateClientProgramAction({
        entities: {
          trainerId,
          clientId: client.id,
        },
        body: {
          lengthOfWorkout: parseInt(formData.lengthOfWorkout),
          // lengthOfProgram: parseInt(formData.lengthOfWorkout),
          preferredExercises: formData.preferredExercises,
          daysPerWeek: parseInt(formData.daysPerWeek),
          otherNotes: formData.otherNotes,
        },
      })
      if (error) {
        toast('Error generating workout', {
          description: `Code: ${error.code}, Message: ${error.message}`,
        })
        return
      }
      toast('Generated workout!')
    })
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        {/* <VersionSwitcher versions={versions} defaultVersion="coach profile 1" /> */}
        <div className="px-4">
          <Tp variant="h3">{client.firstName}</Tp>
        </div>
        <Separator className="mt-2" />
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="-mx-px pr-4">
          <div className="space-y-6 px-6 py-4">
            <div className="space-y-3">
              <p>Profile</p>
              <Separator className="" />
              {basicInfo.map(({ name, value }) => (
                <div
                  key={name}
                  className="grid w-[400px] grid-cols-3 gap-4 space-y-2"
                >
                  <p className="col-span-2 text-sm leading-none text-muted-foreground">
                    {name}
                  </p>
                  <p className="col-span-1 leading-none">{value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p>Details</p>
              <Separator className="" />
              <div className="pt-1">
                {client.details.map((detail) => (
                  <Card key={detail.id} className="relative">
                    <CardHeader>
                      <p className="font-normal tracking-tight">
                        {detail.title}
                      </p>
                      <p className="whitespace-pre-wrap text-sm font-normal leading-snug text-muted-foreground">
                        {detail.description}
                      </p>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p>Program Parameters</p>
              <Separator className="" />
              <ProgramParametersForm
                exercises={exercises}
                formName="programParametersForm"
                onSubmit={handleOnSubmit}
              />
            </div>
          </div>
        </ScrollArea>
        <SidebarFooter>
          <div className="px-4 pb-2">
            <LoadingButton
              isLoading={isPending}
              type="submit"
              form="programParametersForm"
            >
              Generate
              <Icons.sparkles className="h-5 w-5" />
            </LoadingButton>
          </div>
        </SidebarFooter>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
