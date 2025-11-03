"use client"

import { useQuery } from "convex/react"
import { BasicSkeleton } from "@/components/skeletons/basic-skeleton"
import { api } from "@/convex/_generated/api"
import { ProgramsList } from "./program-list"

export default function ProgramsListWithData() {
  const programs = useQuery(api.programs.getAll)

  if (programs === undefined) {
    return <BasicSkeleton />
  }

  return <ProgramsList programs={programs} />
}
