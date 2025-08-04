"use client"

import { useState } from "react"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"

interface DebugToggleProps {
  onToggle: (isDebugMode: boolean) => void
}

export function DebugToggle({ onToggle }: DebugToggleProps) {
  const [isDebugMode, setIsDebugMode] = useState(false)

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null
  }

  const handleToggle = () => {
    const newDebugMode = !isDebugMode
    setIsDebugMode(newDebugMode)
    onToggle(newDebugMode)
  }

  return (
    <div className="absolute bottom-2 left-2 z-50">
      <Button
        className="h-8 w-20 font-mono text-xs"
        onClick={handleToggle}
        size="sm"
        variant={isDebugMode ? "default" : "outline"}
      >
        {isDebugMode ? (
          <>
            <Icons.hide className="mr-1 h-3 w-3" />
            Hide
          </>
        ) : (
          <>
            <Icons.view className="mr-1 h-3 w-3" />
            Debug
          </>
        )}
      </Button>
    </div>
  )
}
