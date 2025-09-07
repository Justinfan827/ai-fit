"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import {
  type CreateClientInput,
  createClientAction,
} from "@/actions/create-client"
import {
  type CreateClientFormType,
  NewClientForm,
} from "@/components/forms/NewClientForm"
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
import { Icons } from "./icons"
import LoadingButton from "./loading-button"

export default function ClientButtonNewClient() {
  const formName = "new-client-form"
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const onSubmit = (data: CreateClientFormType) => {
    startTransition(async () => {
      // map data to CreateClientInput
      const input: CreateClientInput = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        age: data.age,
        // if ft-in, conver heightFeet and heightInches to a inches value
        ...(data.heightUnit === "in"
          ? {
              height: (data.heightFeet || 0) * 12 + (data.heightInches || 0),
            }
          : {
              height: data.heightValue,
            }),
        heightUnit: data.heightUnit,
        weight: data.weightValue,
        weightUnit: data.weightUnit,
      }
      const { error, data: client } = await createClientAction(input)
      if (error) {
        toast.error("Something went wrong. Please try again later.")
        return
      }
      router.push(`/home/clients/${client.id}`)
    })
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
          <LoadingButton form={formName} isLoading={isPending} type="submit">
            Create
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
