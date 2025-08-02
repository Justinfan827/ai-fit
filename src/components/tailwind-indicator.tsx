"use client"
import { useEffect, useState } from "react"
import { Icons } from "./icons"

export function TailwindIndicator() {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    setWidth(window.innerWidth)
    const handleResize = () => {
      setWidth(window.innerWidth)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])
  return (
    <div className="fixed right-1 bottom-1 z-50 flex h-6 w-auto items-center justify-center gap-1 rounded-full px-3 py-2 font-mono text-white text-xs transition-all duration-300 ease-in-out">
      <div className="block rounded-full bg-red-600 px-2 py-1 transition-all duration-300 sm:hidden">
        <div className="flex items-center gap-1">
          <Icons.smartphone className="h-3 w-3" />
          <span className="ml-1">xs: {width}</span>
        </div>
      </div>
      <div className="hidden rounded-full bg-orange-600 px-2 py-1 transition-all duration-300 sm:block md:hidden lg:hidden xl:hidden 2xl:hidden">
        <div className="flex items-center gap-1">
          <Icons.smartphone className="h-3 w-3" />
          <span>sm: {width}</span>
        </div>
      </div>
      <div className="hidden rounded-full bg-yellow-600 px-2 py-1 transition-all duration-300 md:block lg:hidden xl:hidden 2xl:hidden">
        <div className="flex items-center gap-1">
          <Icons.tablet className="h-3 w-3" />
          <span>md: {width}</span>
        </div>
      </div>
      <div className="hidden rounded-full bg-green-600 px-2 py-1 transition-all duration-300 lg:block xl:hidden 2xl:hidden">
        <div className="flex items-center gap-1">
          <Icons.laptop className="h-3 w-3" />
          <span>lg: {width}</span>
        </div>
      </div>
      <div className="hidden rounded-full bg-blue-600 px-2 py-1 transition-all duration-300 xl:block 2xl:hidden">
        <div className="flex items-center gap-1">
          <Icons.monitor className="h-3 w-3" />
          <span>xl: {width}</span>
        </div>
      </div>
      <div className="hidden rounded-full bg-purple-600 px-2 py-1 transition-all duration-300 2xl:block">
        <div className="flex items-center gap-1">
          <Icons.monitor className="h-3 w-3" />
          <span>2xl: {width}</span>
        </div>
      </div>
    </div>
  )
}
