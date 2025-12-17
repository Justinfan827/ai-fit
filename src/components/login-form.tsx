"use client"

import { useSignIn } from "@clerk/clerk-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "@tanstack/react-router"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { isLive } from "@/lib/utils"
import MLoadingButton from "./massor/buttons/m-buttons"
import { PasswordInput } from "./password-input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form"

type Inputs = z.infer<typeof authSchema>
export const authSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters long",
    })
    .max(100),
})
export function LoginForm() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { signIn, setActive, isLoaded } = useSignIn()
  const form = useForm<Inputs>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: isLive() ? "" : "user+1@test.com",
      password: isLive() ? "" : "password123",
    },
  })

  const onSubmit = (data: Inputs) => {
    if (!isLoaded) {
      return
    }

    startTransition(async () => {
      try {
        const result = await signIn.create({
          identifier: data.email,
          password: data.password,
        })

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId })
          router.navigate({ to: "/home/clients" })
        } else {
          toast.error("Sign in incomplete. Please try again.")
        }
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message || "Email sign in failed")
        } else {
          toast.error("Email sign in failed")
        }
        return
      }
    })
  }
  return (
    <div className="w-[400px] space-y-10">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="font-secondary text-3xl">Massor</h1>
        <p className="text-center text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>
      <Form {...form}>
        <form
          className="space-y-10"
          id="login-form"
          onSubmit={(...args) => form.handleSubmit(onSubmit)(...args)}
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="">Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormDescription>Enter your email address</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="••••••••••" {...field} />
                </FormControl>
                <FormDescription>Enter your password</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
      <div className="w-full">
        <MLoadingButton
          className="w-full"
          form="login-form"
          isLoading={isPending}
          type="submit"
        >
          Sign in
        </MLoadingButton>
      </div>
    </div>
  )
}
