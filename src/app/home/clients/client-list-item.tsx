"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Client } from "@/lib/domain/clients"
import { cn } from "@/lib/utils"

export default function ClientListItem({ client }: { client: Client }) {
  return (
    <div
      className={cn(
        "group relative isolate flex items-center gap-2 rounded-md border px-4 py-4",
        "transition-all duration-200 ease-in-out hover:shadow-lg hover:shadow-primary/10"
      )}
    >
      <Link
        className="absolute inset-0 z-10"
        href={`/home/clients/${client.id}`}
      />
      <div className="flex items-center gap-4 ">
        <Avatar className="size-8 rounded-lg text-muted-foreground grayscale transition-all duration-200 ease-in-out group-hover:size-8.5 group-hover:text-primary">
          <AvatarImage alt={client.firstName} src={client.avatarURL} />
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
    </div>
  )
}
