'use client'
import { useEffect, useState } from 'react'

export function TailwindIndicator() {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setWidth(window.innerWidth)
    const handleResize = () => {
      setWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  return (
    <div className="fixed right-1 bottom-1 z-50 flex h-6 w-24 items-center justify-center rounded-full bg-gray-800 p-3 font-mono text-xs text-white">
      <div className="block sm:hidden">xs</div>
      <div className="hidden sm:block md:hidden lg:hidden xl:hidden 2xl:hidden">
        sm: {width}
      </div>
      <div className="hidden md:block lg:hidden xl:hidden 2xl:hidden">
        md: {width}
      </div>
      <div className="hidden lg:block xl:hidden 2xl:hidden">lg: {width}</div>
      <div className="hidden xl:block 2xl:hidden">xl: {width}</div>
      <div className="hidden 2xl:block">2xl: {width}</div>
    </div>
  )
}
