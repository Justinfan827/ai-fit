"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { createBrowserClient } from "@/lib/supabase/create-browser-client"
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
  email: z.email({
    error: "Please enter a valid email address",
  }),
  password: z
    .string()
    .min(6, {
      error: "Password must be at least 8 characters long",
    })
    .max(100),
})
export function LoginForm() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const client = createBrowserClient()
  const form = useForm<Inputs>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: isLive() ? "" : "user+1@test.com",
      password: isLive() ? "" : "password123",
    },
  })

  // const searchParams = useSearchParams()
  // const originalPath = searchParams.get('original_path') || ''
  const onSubmit = (data: Inputs) => {
    startTransition(async () => {
      try {
        const { error } = await client.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
        if (error) {
          throw error
        }
        // TODO: support email sign up flow.
        // const authURL = siteConfig.auth.callbackURL({
        //   query: new URLSearchParams({
        //     // original_path: originalPath,
        //   }),
        // })
        // const { error } = await client.auth.signInWithOtp({
        //   email: data.email,
        //   options: {
        //     shouldCreateUser: false,
        //     emailRedirectTo: authURL,
        //   },
        // })
        // toast({
        //   title: 'Check your email',
        //   description:
        //     'We sent you an email! Click the link there to sign in. You may close this tab.',
        // })
        router.push("/home/clients")
      } catch (error) {
        if (error instanceof Error) {
          toast("Email sign in failed")
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
