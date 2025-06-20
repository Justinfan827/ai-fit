'use client'

import { createClientProgramAction } from '@/actions/create-client-program-action'
import { ProgramParametersFormType } from '@/components/forms/ProgramParametersForm'
import { Icons } from '@/components/icons'
import LoadingButton from '@/components/loading-button'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ClientHomePage } from '@/lib/domain/clients'
import { useTransition } from 'react'

export default function GenerateProgramModal({
  client,
}: {
  client: ClientHomePage
}) {
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

  const [isPending, startTransition] = useTransition()
  const handleOnSubmit = (data: ProgramParametersFormType) => {
    startTransition(async () => {
      const { error } = await createClientProgramAction({
        clientId: client.id,
        clientInfo: {
          age: client.age,
          weightKg: client.weightKg,
          heightCm: client.heightCm,
          liftingExperienceMonths: client.liftingExperienceMonths,
          gender: client.gender,
        },
        programParameters: {
          lengthOfWorkout: parseInt(data.lengthOfWorkout),
          daysPerWeek: parseInt(data.daysPerWeek),
          // lengthOfProgram: parseInt(data.lengthOfProgram),
          otherNotes: data.otherNotes,
        } as any,
      })
    })
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="submit">
          Generate
          <Icons.sparkles className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>
              Generate {client.firstName}&apos;s Program
            </DialogTitle>
            <Icons.sparkles className="h-5 w-5" />
          </div>
          <DialogDescription>
            Review {client.firstName}&apos;s profile and generate a custom
            indvidualized program.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mx-px h-[700px] pr-4">
          <div className="space-y-6 px-px">
            <div className="space-y-3">
              <p>Profile</p>
              <Separator className="" />
              {basicInfo.map(({ name, value }) => (
                <div
                  key={name}
                  className="grid w-[400px] grid-cols-3 gap-4 space-y-2"
                >
                  <p className="text-muted-foreground col-span-2 text-sm leading-none">
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
                      <p className="text-muted-foreground text-sm leading-snug font-normal whitespace-pre-wrap">
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
              {/* <ProgramParametersForm
                formName="programParametersForm"
                onSubmit={handleOnSubmit}
              /> */}
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <LoadingButton
            isLoading={isPending}
            type="submit"
            form="programParametersForm"
            className="w-[100px] whitespace-nowrap"
          >
            Generate
            <Icons.sparkles className="h-5 w-5" />
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
