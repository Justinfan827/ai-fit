'use client'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { createClientDetailAction } from '@/actions/create-client-detail'
import { deleteClientDetailAction } from '@/actions/delete-client-detail'
import { Icons } from '@/components/icons'
import LoadingButton from '@/components/loading-button'
import { PageSection, PageSectionHeader } from '@/components/page-layout'
import { Button } from '@/components/ui/button'
import { Card, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ClientDetail } from '@/lib/domain/clients'
import { inputTrim } from '@/lib/utils/util'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export const AddClientDetailFormSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  description: z.string().min(2, {
    message: 'Description must be at least 2 characters.',
  }),
})
type ClientDetailFormType = z.infer<typeof AddClientDetailFormSchema>

type ClientDetailFormProps = {
  formName: string
  isPending: boolean
  onSubmit: (data: ClientDetailFormType) => void
  onCancel: () => void
}
export function ClientDetailsPageSection({
  clientUserId,
  details,
}: {
  clientUserId: string
  details: ClientDetail[]
}) {
  const [isAddingDetail, setIsAddingDetail] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleOnSubmit = (data: ClientDetailFormType) => {
    startTransition(async () => {
      const { error } = await createClientDetailAction({
        clientId: clientUserId,
        title: inputTrim(data.title),
        description: inputTrim(data.description),
      })
      if (error) {
        toast('Error', {
          description: (
            <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
              <code className="text-white">
                {JSON.stringify(error, null, 2)}
              </code>
            </pre>
          ),
        })
      }
      setIsAddingDetail(false)
    })
  }

  const handleRemoveDetail = (detailId: string) => {
    startTransition(async () => {
      const { error } = await deleteClientDetailAction({
        clientId: clientUserId,
        detailId,
      })
      if (error) {
        toast('Error', {
          description: (
            <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
              <code className="text-white">
                {JSON.stringify(error, null, 2)}
              </code>
            </pre>
          ),
        })
      }
    })
  }

  return (
    <PageSection>
      <div className="flex items-center gap-4">
        <PageSectionHeader>Details</PageSectionHeader>
        {!isAddingDetail && (
          <Button
            variant="dashed"
            size="sm"
            onClick={() => setIsAddingDetail(true)}
          >
            <Icons.plus className="h-3 w-3" />
            New detail
          </Button>
        )}
      </div>
      {isAddingDetail && (
        <ClientDetailForm
          isPending={isPending}
          formName="add-client-detail-form"
          onCancel={() => setIsAddingDetail(false)}
          onSubmit={handleOnSubmit}
        />
      )}

      {details.map((detail) => (
        <Card key={detail.id} className="relative">
          <Button
            className="text-muted-foreground absolute top-2 right-2"
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveDetail(detail.id)}
          >
            <Icons.x className="h-5 w-5" />
          </Button>
          <CardHeader>
            <p className="font-normal tracking-tight">{detail.title}</p>
            <p className="text-muted-foreground text-sm leading-snug font-normal whitespace-pre-wrap">
              {detail.description}
            </p>
          </CardHeader>
        </Card>
      ))}
    </PageSection>
  )
}
function ClientDetailForm({
  formName,
  onSubmit,
  onCancel,
  isPending,
}: ClientDetailFormProps) {
  const initialState = {
    title: '',
    description: '',
  }
  const form = useForm<ClientDetailFormType>({
    resolver: zodResolver(AddClientDetailFormSchema),
    defaultValues: initialState,
  })
  return (
    <Card>
      <Form {...form}>
        {/* <FormContainer form={form} /> */}
        <form id={formName} onSubmit={form.handleSubmit(onSubmit)} className="">
          <CardHeader className="px-6 pt-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="grid grid-cols-5 items-center">
                  <div className="col-span-1">
                    <FormLabel className="font-normal tracking-tight">
                      Title
                    </FormLabel>
                  </div>
                  <div className="col-span-4 space-y-2">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </div>
                  <FormDescription className="sr-only">
                    Enter the title of the detail.
                  </FormDescription>
                  <div className="col-span-5"></div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="grid grid-cols-5 items-center">
                  <div className="col-span-1">
                    <FormLabel className="font-normal tracking-tight">
                      Description
                    </FormLabel>
                  </div>
                  <div className="col-span-4 space-y-2">
                    <FormControl>
                      <Textarea
                        className="text-sm leading-snug font-normal"
                        {...field}
                      ></Textarea>
                    </FormControl>
                    <FormMessage />
                  </div>
                  <FormDescription className="sr-only">
                    Enter the title of the detail.
                  </FormDescription>
                  <div className="col-span-5"></div>
                </FormItem>
              )}
            />
          </CardHeader>
          <CardFooter className="space-x-2 px-6 pb-6">
            <LoadingButton isLoading={isPending} variant="default">
              Save
            </LoadingButton>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
