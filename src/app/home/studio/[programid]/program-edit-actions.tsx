"use client"
import { useState } from "react"
import { Icons } from "@/components/icons"
import LoadingButton from "@/components/loading-button"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export default function ProgramActions() {
  const [isEdited, setIsEdited] = useState(false)
  const { open } = useSidebar()
  return (
    <div className="flex items-center justify-center space-x-2">
      <LoadingButton
        className="w-20"
        isLoading={isEdited}
        onClick={() => setIsEdited(true)}
        variant="outline"
      >
        Save
      </LoadingButton>
      <SidebarTrigger
        className={cn(
          "size-9",
          open &&
            "!bg-primary !text-primary-foreground transition-colors duration-200 ease-in-out"
        )}
        customIcon={<Icons.sparkles className="size-4" />}
        variant="outline"
      />
    </div>
  )
}
