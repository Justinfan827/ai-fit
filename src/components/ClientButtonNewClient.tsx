'use client'

import { NewClientForm } from '@/components/forms/NewClientForm'
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

export default function ClientButtonNewClient() {
  const formName = 'new-client-form'
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
          <NewClientForm formName={formName} />
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
