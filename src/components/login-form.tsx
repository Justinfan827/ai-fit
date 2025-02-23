'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { createBrowserClient } from '@/lib/supabase/create-browser-client'
import { isClient } from '@/lib/supabase/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Icons } from './icons'
import { PasswordInput } from './password-input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'

type Inputs = z.infer<typeof authSchema>
export const authSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
  password: z
    .string()
    .min(6, {
      message: 'Password must be at least 8 characters long',
    })
    .max(100),
})
export function LoginForm() {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const client = createBrowserClient()
  const form = useForm<Inputs>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: 'user+1@test.com',
      password: 'password123',
    },
  })

  // const searchParams = useSearchParams()
  // const originalPath = searchParams.get('original_path') || ''
  const onSubmit = async (data: Inputs) => {
    startTransition(async () => {
      // const authURL = siteConfig.auth.callbackURL({
      //   query: new URLSearchParams({
      //     // original_path: originalPath,
      //   }),
      // })
      try {
        const { error } = await client.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
        // const { error } = await client.auth.signInWithOtp({
        //   email: data.email,
        //   options: {
        //     shouldCreateUser: false,
        //     emailRedirectTo: authURL,
        //   },
        // })
        if (error) {
          throw error
        }
        // toast({
        //   title: 'Check your email',
        //   description:
        //     'We sent you an email! Click the link there to sign in. You may close this tab.',
        // })

        const { data: uData, error: uErr } = await client.auth.getUser()
        if (uErr) {
          throw uErr
        }
        if (isClient(uData.user)) {
          router.push(`/clients/${uData.user.id}`)
        } else {
          router.push(`/home`)
        }
      } catch (error) {
        if (error instanceof Error) {
          toast({
            variant: 'destructive',
            title: 'Email sign in failed',
            description: `Something went wrong, please try again`,
          })
        }
        return
      }
    })
  }
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="grid gap-4"
            onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button disabled={isPending}>
              {isPending && (
                <Icons.spinner
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              Sign in
              <span className="sr-only hidden">Sign in</span>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
