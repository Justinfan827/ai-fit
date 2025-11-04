"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Icons } from "@/components/icons"
import MLoadingButton from "@/components/massor/buttons/m-buttons"
import { PageSectionHeader } from "@/components/page-layout"
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
import { api } from "@/convex/_generated/api"
import { inputTrim } from "@/lib/utils/util"

export const AddClientDetailFormSchema = z.object({
  title: z.string().min(2, {
    error: "Title must be at least 2 characters.",
  }),
  description: z.string().min(2, {
    error: "Description must be at least 2 characters.",
  }),
})
type TrainerNoteFormType = z.infer<typeof AddClientDetailFormSchema>

type TrainerNoteFormProps = {
  formName: string
  isPending: boolean
  onSubmit: (data: TrainerNoteFormType) => void
  onCancel: () => void
}

type ClientTrainerNotesPageSectionProps = {
  clientUserId: string
}

export function ClientTrainerNotesPageSection({
  clientUserId,
}: ClientTrainerNotesPageSectionProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const trainerNotes = useQuery(api.trainerNotes.getByTrainerAndClient, {
    clientId: clientUserId,
  })
  const createNote = useMutation(api.trainerNotes.create)
  const deleteNote = useMutation(api.trainerNotes.softDelete)

  const handleOnSubmit = async (data: TrainerNoteFormType) => {
    setIsPending(true)
    try {
      await createNote({
        clientId: clientUserId,
        title: inputTrim(data.title),
        description: inputTrim(data.description),
      })
      toast.success("Detail added successfully", {
        description: <code className="text-xs">{data.title}</code>,
      })
      setIsEditingNotes(false)
    } catch (error) {
      toast.error("Error", {
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(error, null, 2)}</code>
          </pre>
        ),
      })
    } finally {
      setIsPending(false)
    }
  }

  const handleRemoveDetail = async (noteId: string) => {
    setIsPending(true)
    try {
      await deleteNote({
        clientId: clientUserId,
        noteId,
      })
      toast.success("Note deleted successfully")
    } catch (error) {
      toast.error("Error", {
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(error, null, 2)}</code>
          </pre>
        ),
      })
    } finally {
      setIsPending(false)
    }
  }

  const notes = trainerNotes ?? []

  return (
    <>
      <PageSectionHeader>Notes</PageSectionHeader>
      {notes.map((trainerNote) => (
        <Card className="relative" key={trainerNote.id}>
          <Button
            className="absolute top-2 right-2 text-muted-foreground"
            onClick={() => handleRemoveDetail(trainerNote.id)}
            size="icon"
            variant="ghost"
          >
            <Icons.x className="h-5 w-5" />
          </Button>
          <CardHeader>
            <p className="font-normal tracking-tight">{trainerNote.title}</p>
            <p className="whitespace-pre-wrap font-normal text-muted-foreground text-sm leading-snug">
              {trainerNote.description}
            </p>
          </CardHeader>
        </Card>
      ))}
      {isEditingNotes && (
        <TrainerNoteForm
          formName="add-client-detail-form"
          isPending={isPending}
          onCancel={() => setIsEditingNotes(false)}
          onSubmit={handleOnSubmit}
        />
      )}
      {!isEditingNotes && (
        <Button
          onClick={() => setIsEditingNotes(true)}
          size="sm"
          variant="dashed"
        >
          <Icons.plus className="h-3 w-3" />
          New note
        </Button>
      )}
    </>
  )
}
function TrainerNoteForm({
  formName,
  onSubmit,
  onCancel,
  isPending,
}: TrainerNoteFormProps) {
  const initialState = {
    title: "",
    description: "",
  }
  const form = useForm<TrainerNoteFormType>({
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
            <MLoadingButton isLoading={isPending} variant="default">
              Save
            </MLoadingButton>
            <Button onClick={onCancel} type="button" variant="outline">
              Cancel
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
