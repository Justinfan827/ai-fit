"use client"

import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import type { CreateClientInput } from "@/actions/create-client"
import { NewClientForm } from "@/components/forms/NewClientForm"
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
import { api } from "@/convex/_generated/api"
import { Icons } from "./icons"
import MLoadingButton from "./massor/buttons/m-buttons"

export default function ClientButtonNewClient() {
  const formName = "new-client-form"
  const router = useRouter()
  const createClient = useMutation(api.users.createClient)
  const [isPending, setIsPending] = useState(false)

  const onSubmit = async (data: CreateClientInput) => {
    setIsPending(true)
    try {
      // Transform form data to match Convex mutation args
      // Convert height: if inches, convert feet+inches to total inches
      const heightValue =
        data.height.unit === "in"
          ? data.height.feet * 12 + data.height.inches
          : data.height.cm

      // Convert weight: use the value directly (kg or lbs)
      const weightValue =
        data.weight.unit === "lbs" ? data.weight.lbs : data.weight.kg

      const client = await createClient({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        age: data.age,
        gender: data.gender,
        heightValue,
        heightUnit: data.height.unit,
        weightValue,
        weightUnit: data.weight.unit,
      })

      router.push(`/home/clients/${client.id}`)
    } catch (error) {
      console.error("Error creating client:", error)
      toast.error("Something went wrong. Please try again later.")
    } finally {
      setIsPending(false)
    }
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          New Client
          <Icons.plus className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex-1 space-y-6 px-4 py-4 sm:min-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Client</DialogTitle>
          <DialogDescription className="">
            Create a new client profile with basic information and measurements
          </DialogDescription>
        </DialogHeader>
        <div className="scrollbar scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent grid max-h-[500px] gap-4 overflow-y-auto">
          <NewClientForm formName={formName} onSubmit={onSubmit} />
        </div>
        <DialogFooter>
          <MLoadingButton form={formName} isLoading={isPending} type="submit">
            Create
          </MLoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
