"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { assignProgramAction } from "@/actions/assign-program"
import LoadingButton from "@/components/loading-button"
import { ProgramPicker } from "@/components/program-dropdown-picker"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import type { Program } from "@/lib/domain/workouts"

const assignProgramSchema = z.object({
  programId: z.string().min(1, "Please select a program"),
})

interface Props {
  clientId: string
  programs: Program[]
}

type AssignProgramFormValues = z.infer<typeof assignProgramSchema>

export default function AssignProgramButton({ clientId, programs }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const form = useForm<AssignProgramFormValues>({
    resolver: zodResolver(assignProgramSchema),
    defaultValues: {
      programId: "",
    },
  })

  const handleAssignProgram = async (values: AssignProgramFormValues) => {
    const { error } = await assignProgramAction({
      clientId,
      programId: values.programId,
    })

    if (error) {
      toast("Error assigning program", {
        description: error.message,
      })
      return
    }

    toast("Program assigned", {})
    setIsOpen(false)
    form.reset()
    router.refresh()
  }
  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <LoadingButton
          isLoading={form.formState.isSubmitting}
          onClick={() => {
            setIsOpen(true)
          }}
          variant="outline"
        >
          Assign program
        </LoadingButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Program</DialogTitle>
          <DialogDescription>Assign a program to this client</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleAssignProgram)}
          >
            <FormField
              control={form.control}
              name="programId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program</FormLabel>
                  <FormControl>
                    <ProgramPicker
                      handleSelect={({ value }) => {
                        field.onChange(value)
                      }}
                      programs={programs}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button disabled={form.formState.isSubmitting} type="submit">
                {form.formState.isSubmitting ? "Assigning..." : "Assign"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
