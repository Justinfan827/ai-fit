"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { createProgramAction } from "@/actions/create-program"
import { Icons } from "@/components/icons"
import MLoadingButton from "@/components/massor/buttons/m-buttons"
import {
  EditorProgramProvider,
  useZProgramWorkouts,
} from "@/hooks/zustand/program-editor-state"
import type { Exercise } from "@/lib/domain/workouts"

export default function NewProgramButton({
  exercises,
}: {
  exercises: Exercise[]
}) {
  return (
    <EditorProgramProvider exercises={exercises}>
      <NewProgramButtonContent />
    </EditorProgramProvider>
  )
}

function NewProgramButtonContent() {
  const workouts = useZProgramWorkouts()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const handleOnCreate = () => {
    startTransition(async () => {
      const { data, error } = await createProgramAction({
        type: "splits",
        name: "New Program",
        created_at: new Date().toISOString(),
        workouts,
      })
      if (error) {
        toast.error("Something went wrong", {
          description: "Please try again later!",
        })
        return
      }
      router.push(`/home/studio/${data.id}`)
      toast("Success", {
        description: "Program created",
      })
    })
  }
  return (
    <MLoadingButton isLoading={isPending} onClick={handleOnCreate}>
      New program
      <Icons.sparkles className="h-5 w-5" />
    </MLoadingButton>
  )
}
