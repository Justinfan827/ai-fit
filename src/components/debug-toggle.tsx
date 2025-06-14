'use client'

import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface DebugToggleProps {
  onToggle: (isDebugMode: boolean) => void
}

export function DebugToggle({ onToggle }: DebugToggleProps) {
  const [isDebugMode, setIsDebugMode] = useState(false)

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  const handleToggle = () => {
    const newDebugMode = !isDebugMode
    setIsDebugMode(newDebugMode)
    onToggle(newDebugMode)
  }

  return (
    <div className="fixed bottom-1 left-1 z-50">
      <Button
        size="sm"
        variant={isDebugMode ? 'default' : 'outline'}
        onClick={handleToggle}
        className="h-8 w-20 font-mono text-xs"
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
