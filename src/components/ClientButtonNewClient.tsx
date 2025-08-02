"use client"

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

export default function ClientButtonNewClient() {
  const formName = "new-client-form"

  const onSubmit = async (data: CreateClientFormType) => {
    const { error } = await createClientAction(data)
    if (error) {
      return toast("Error", {
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(error, null, 2)}</code>
          </pre>
        ),
      })
    }
    toast("You submitted", {
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Icons.plus className="size-4" />
          New Client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:min-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Client</DialogTitle>
          <DialogDescription className="sr-only">
            Add a new client
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <NewClientForm formName={formName} onSubmit={onSubmit} />
        </div>
        <DialogFooter>
          <Button form={formName} type="submit">
            Create New Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
