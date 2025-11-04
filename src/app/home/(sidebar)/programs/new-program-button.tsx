"use client"

import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import MLoadingButton from "@/components/massor/buttons/m-buttons"
import { api } from "@/convex/_generated/api"

export default function NewProgramButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const createProgram = useMutation(api.programs.create)

  const handleOnCreate = () => {
    startTransition(async () => {
      try {
        const data = await createProgram({
          type: "splits",
          name: "New Program",
          workouts: [],
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
