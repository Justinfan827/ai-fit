import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

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

export const CreateClientFormScham = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

export type CreateClientFormType = z.infer<typeof CreateClientFormScham>

type NewClientFormProps = {
  formName: string
  onSubmit: (data: CreateClientFormType) => void
}

export function NewClientForm({ formName, onSubmit }: NewClientFormProps) {
  const initialState = {
    firstName: "",
    lastName: "",
    email: "",
  }
  const form = useForm<z.infer<typeof CreateClientFormScham>>({
    resolver: zodResolver(CreateClientFormScham),
    defaultValues: initialState,
  })

  return (
    <Form {...form}>
      {/* <FormDebugContainer form={form} /> */}
      <form
        className="space-y-6"
        id={formName}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {/* First Name Field */}
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription className="sr-only">
                Client&apos;s first name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Last Name Field */}
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription className="sr-only">
                Client&apos;s last name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormDescription className="sr-only">
                Client&apos;s email address
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
