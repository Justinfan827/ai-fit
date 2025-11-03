"use client"

import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import MLoadingButton from "@/components/massor/buttons/m-buttons"
import { api } from "@/convex/_generated/api"
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
  const createProgram = useMutation(api.programs.create)

  const handleOnCreate = () => {
    startTransition(async () => {
      try {
        // Map workouts to the format expected by Convex mutation
        const workoutsForMutation = workouts.map((workout, index) => ({
          name: workout.name,
          blocks: workout.blocks,
          programOrder: workout.program_order ?? index,
          week: workout.week,
        }))

        const data = await createProgram({
          type: "splits",
          name: "New Program",
          workouts: workoutsForMutation,
        })
        router.push(`/home/studio/${data.id}`)
        toast("Success", {
          description: "Program created",
        })
      } catch {
        toast.error("Something went wrong", {
          description: "Please try again later!",
        })
      }
    })
  }
  return (
    <MLoadingButton isLoading={isPending} onClick={handleOnCreate}>
      New program
      <Icons.sparkles className="h-5 w-5" />
    </MLoadingButton>
  )
}
