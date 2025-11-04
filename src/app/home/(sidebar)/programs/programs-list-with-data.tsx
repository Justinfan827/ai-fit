import { useQuery } from "convex/react"
import type { ReactNode } from "react"
import { BasicSkeleton } from "@/components/skeletons/basic-skeleton"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { ProgramsList } from "./program-list"

interface ProgramsListWithDataProps {
  clientId?: string
  emptyState?: {
    title: string
    subtitle: string
    buttonText?: string
    buttonAction?: () => void
    actionComponent?: ReactNode
    isActionPending?: boolean
  }
}

export default function ProgramsListWithData({
  clientId,
  emptyState,
}: ProgramsListWithDataProps) {
  const programs = useQuery(
    api.programs.getAll,
    clientId ? { clientId: clientId as Id<"users"> } : {}
  )

  if (programs === undefined) {
    return <BasicSkeleton />
  }

  return <ProgramsList emptyState={emptyState} programs={programs} />
}
