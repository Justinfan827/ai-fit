"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import MLoadingButton from "@/components/massor/buttons/m-buttons"
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
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

const assignProgramSchema = z.object({
  programId: z.string().min(1, "Please select a program"),
})

interface Props {
  clientId: string
}

type AssignProgramFormValues = z.infer<typeof assignProgramSchema>

export default function AssignProgramButton({ clientId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const assignProgram = useMutation(api.programs.assignProgramToClient)
  const programs = useQuery(api.programs.getTrainerPrograms)

  const form = useForm<AssignProgramFormValues>({
    resolver: zodResolver(assignProgramSchema),
    defaultValues: {
      programId: "",
    },
  })

  const handleAssignProgram = async (values: AssignProgramFormValues) => {
    try {
      await assignProgram({
        clientId: clientId as Id<"users">,
        programId: values.programId as Id<"programs">,
      })

      toast.success("Program assigned")
      setIsOpen(false)
      form.reset()
    } catch (error) {
      toast.error("Error assigning program", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      })
    }
  }
  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <MLoadingButton
          isLoading={form.formState.isSubmitting}
          onClick={() => {
            setIsOpen(true)
          }}
          variant="outline"
        >
          Assign program
        </MLoadingButton>
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
                    {programs === undefined ? (
                      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                    ) : (
                      <ProgramPicker
                        handleSelect={({ value }) => {
                          field.onChange(value)
                        }}
                        programs={programs}
                        value={field.value}
                      />
                    )}
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
