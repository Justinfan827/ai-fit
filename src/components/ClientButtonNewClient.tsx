"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { createClientAction } from "@/actions/create-client"
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
import { useRouter } from "next/navigation"

export default function ClientButtonNewClient() {
  const formName = "new-client-form"
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const onSubmit = (data: CreateClientFormType) => {
    startTransition(async () => {
      const { error, data: client } = await createClientAction(data)
      if (error) {
        toast.error("Something went wrong. Please try again later.")
        return
      }
      router.push(`/home/clients/${client}`)
    })
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          New Client
          <Icons.plus className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:min-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Client</DialogTitle>
          <DialogDescription className="">
            Create a new client profile
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
