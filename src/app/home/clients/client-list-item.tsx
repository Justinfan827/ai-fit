"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Client } from "@/lib/domain/clients"
import { cn } from "@/lib/utils"

export default function ClientListItem({ client }: { client: Client }) {
  const router = useRouter()
  const handleClick = () => {
    router.push(`/home/clients/${client.id}`)
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      router.push(`/home/clients/${client.id}`)
    }
  }
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md border px-4 py-4",
        "transition-all duration-200 ease-in-out hover:shadow-lg hover:shadow-primary/10"
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center gap-4 ">
        <Avatar className="size-8 rounded-lg grayscale transition-all duration-200 ease-in-out group-hover:size-8.5">
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
        </div>
      </div>
    </div>
  )
}
