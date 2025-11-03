"use client"

import { useMutation } from "convex/react"
import Link from "next/link"
import { useOptimistic, useState } from "react"
import { toast } from "sonner"
import { EmptyStateCard } from "@/components/empty-state"
import { Icons } from "@/components/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import type { ClientBasic } from "@/lib/domain/clients"
import { cn } from "@/lib/utils"

export function ClientsList({ clients }: { clients: ClientBasic[] }) {
  const removeClient = useMutation(api.users.removeClientFromTrainer)
  const [optimisticClients, deleteOptimisticClient] = useOptimistic(
    clients,
    (state, clientId: string) => {
      return state.filter((client) => client.id !== clientId)
    }
  )

  const onDelete = async (clientId: string) => {
    try {
      const deletedClient = clients.find((client) => client.id === clientId)
      deleteOptimisticClient(clientId)
      await removeClient({ clientId: clientId as Id<"clients"> })
      toast.success("Client removed successfully", {
        description: (
          <code className="text-xs">
            {deletedClient?.firstName} {deletedClient?.lastName}
          </code>
        ),
      })
    } catch (error) {
      toast.error("Failed to remove client")
    }
  }

  if (optimisticClients.length === 0) {
    return (
      <EmptyStateCard
        className="w-full"
        subtitle="Add a new client to get started with ai powered programming."
        title="Add a client"
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {optimisticClients.map((client) => (
        <ClientListItem client={client} key={client.id} onDelete={onDelete} />
      ))}
    </div>
  )
}

function ClientListItem({
  client,
  onDelete,
}: {
  client: ClientBasic
  onDelete: (clientId: string) => void
}) {
  return (
    <div
      className={cn(
        "group relative flex items-center justify-between gap-2 rounded-md border px-4 py-4",
        "transition-all duration-200 ease-in-out hover:shadow-lg hover:shadow-primary/10"
      )}
    >
      <Link
        className="absolute inset-0 z-10"
        href={`/home/clients/${client.id}`}
      />
      <div className="flex items-center gap-4">
        <Avatar className="size-8 rounded-lg text-muted-foreground grayscale transition-all duration-200 ease-in-out group-hover:size-8.5 group-hover:text-primary">
          <AvatarImage
            alt={client.firstName}
            src={client.avatarURL ?? undefined}
          />
          <AvatarFallback className="rounded-lg">
            {client.firstName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="capitalize">
            {client.firstName} {client.lastName}
          </div>
          <div className="text-muted-foreground text-xs">{client.email}</div>
          <div className="text-muted-foreground text-xs">
            {new Date(client.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
      <ClientListItemMenu client={client} onDelete={onDelete} />
    </div>
  )
}

function ClientListItemMenu({
  client,
  onDelete,
}: {
  client: ClientBasic
  onDelete: (clientId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="z-20" size="icon" variant="ghost">
            <Icons.ellipsisVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DialogTrigger asChild>
            <DropdownMenuItem className="">
              <Icons.trash className="size-4" />
              Remove
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Remove "{client.firstName} {client.lastName}"?
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this client from your list? The
            client account will be preserved but they will no longer be
            associated with you.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={() => onDelete(client.id)} variant="destructive">
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Keep the old export for backwards compatibility if needed
export default ClientListItem
