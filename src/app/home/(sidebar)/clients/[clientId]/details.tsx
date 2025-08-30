"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { createClientDetailAction } from "@/actions/create-client-detail"
import { deleteClientDetailAction } from "@/actions/delete-client-detail"
import { Icons } from "@/components/icons"
import LoadingButton from "@/components/loading-button"
import { PageSection, PageSectionHeader } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ClientDetail } from "@/lib/domain/clients"
import { inputTrim } from "@/lib/utils/util"

export const AddClientDetailFormSchema = z.object({
  title: z.string().min(2, {
    error: "Title must be at least 2 characters.",
  }),
  description: z.string().min(2, {
    error: "Description must be at least 2 characters.",
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
        toast("Error", {
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
        toast("Error", {
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
            onClick={() => setIsAddingDetail(true)}
            size="sm"
            variant="dashed"
          >
            <Icons.plus className="h-3 w-3" />
            New detail
          </Button>
        )}
      </div>
      {isAddingDetail && (
        <ClientDetailForm
          formName="add-client-detail-form"
          isPending={isPending}
          onCancel={() => setIsAddingDetail(false)}
          onSubmit={handleOnSubmit}
        />
      )}

      {details.map((detail) => (
        <Card className="relative" key={detail.id}>
          <Button
            className="absolute top-2 right-2 text-muted-foreground"
            onClick={() => handleRemoveDetail(detail.id)}
            size="icon"
            variant="ghost"
          >
            <Icons.x className="h-5 w-5" />
          </Button>
          <CardHeader>
            <p className="font-normal tracking-tight">{detail.title}</p>
            <p className="whitespace-pre-wrap font-normal text-muted-foreground text-sm leading-snug">
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
    title: "",
    description: "",
  }
  const form = useForm<ClientDetailFormType>({
    resolver: zodResolver(AddClientDetailFormSchema),
    defaultValues: initialState,
  })
  return (
    <Card>
      <Form {...form}>
        {/* <FormContainer form={form} /> */}
        <form className="" id={formName} onSubmit={form.handleSubmit(onSubmit)}>
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
                  <div className="col-span-5" />
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
                        className="font-normal text-sm leading-snug"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                  <FormDescription className="sr-only">
                    Enter the title of the detail.
                  </FormDescription>
                  <div className="col-span-5" />
                </FormItem>
              )}
            />
          </CardHeader>
          <CardFooter className="space-x-2 px-6 pb-6">
            <LoadingButton isLoading={isPending} variant="default">
              Save
            </LoadingButton>
            <Button onClick={onCancel} type="button" variant="outline">
              Cancel
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
