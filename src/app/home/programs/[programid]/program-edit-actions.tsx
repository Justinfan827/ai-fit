"use client"
import { useState } from "react"
import LoadingButton from "@/components/loading-button"
import { SidebarTrigger } from "@/components/ui/sidebar"

export default function ProgramActions() {
  const [isEdited, setIsEdited] = useState(false)
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
      <SidebarTrigger />
    </div>
  )
}
