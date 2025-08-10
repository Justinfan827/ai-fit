"use client"

import type { NavigateOptions } from "next/dist/shared/lib/app-router-context.shared-runtime"
import type { useRouter } from "next/navigation"
import type { TransitionStartFunction } from "react"
import { createContext, useContext } from "react"

export type TableRouter = Pick<
  ReturnType<typeof useRouter>,
  "push" | "replace" | "refresh"
>
interface TableContext {
  router: TableRouter
  startTransition: TransitionStartFunction
  isPending: boolean
  baseURL: string
}
const Context = createContext<TableContext | undefined>(undefined)

interface TableProviderProps extends TableContext {
  children: React.ReactNode
}
/**
 * TableProvider provides convenience functions
 * to be able to call router methods within a transition.
 * This lets us show a loading spinner on the table while the transition
 * is running
 */
export default function TableProvider({
  children,
  router,
  isPending,
  startTransition,
  baseURL,
}: TableProviderProps) {
  const replace = (route: string) => {
    startTransition(() => {
      router.replace(route)
    })
  }

  const push = (route: string, options?: NavigateOptions) => {
    startTransition(() => {
      router.push(route, options)
    })
  }

  const refresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }
  return (
    <Context.Provider
      value={{
        router: {
          push,
          replace,
          refresh,
        },
        baseURL,
        isPending,
        startTransition,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useTableRouter = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error("useTableRouter() must be used inside TableProvider")
  }
  return context
}
