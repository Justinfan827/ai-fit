'use client'

import { createClientAction } from '@/actions/create-client'
import {
  CreateClientFormType,
  NewClientForm,
} from '@/components/forms/NewClientForm'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'

export default function ClientButtonNewClient() {
  const formName = 'new-client-form'

  const onSubmit = async (data: CreateClientFormType) => {
    const { error } = await createClientAction(data)
    if (error) {
      return toast({
        title: 'Error',
        variant: 'destructive',
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(error, null, 2)}</code>
          </pre>
        ),
      })
    }
    toast({
      title: 'You submitted the following values:',
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
        <Button variant="outline">New Client</Button>
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
          <Button type="submit" form={formName}>
            Create New Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
