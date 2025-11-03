"use client"
import { useMutation } from "convex/react"
import { useState } from "react"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import MLoadingButton from "@/components/massor/buttons/m-buttons"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import {
  useZProgramId,
  useZProgramName,
  useZProgramWorkouts,
} from "@/hooks/zustand/program-editor-state"
import { cn } from "@/lib/utils"

export default function ProgramActions() {
  const { open } = useSidebar()
  const [isPending, setIsPending] = useState(false)
  const programId = useZProgramId()
  const programName = useZProgramName()
  const workouts = useZProgramWorkouts()

  const updateProgram = useMutation(api.programs.update)

  const handleSaveProgram = async () => {
    setIsPending(true)
    try {
      // Convert programId string to Convex ID format
      const programIdAsId = programId as Id<"programs">
      await updateProgram({
        programId: programIdAsId,
        name: programName,
        workouts: workouts.map((w) => ({
          name: w.name,
          blocks: w.blocks,
          programOrder: w.program_order,
          week: w.week,
        })),
      })
      toast.success("Program saved successfully!")
    } catch {
      toast.error("Failed to save program. Please try again.")
    } finally {
      setIsPending(false)
    }
  }
  return (
    <div className="flex items-center justify-center space-x-2">
      <MLoadingButton
        className="w-20"
        isLoading={isPending}
        onClick={handleSaveProgram}
        variant="outline"
      >
        Save
      </MLoadingButton>
      <SidebarTrigger
        className={cn(
          "size-9",
          open &&
            "!bg-primary !text-primary-foreground transition-colors duration-200 ease-in-out"
        )}
        customIcon={<Icons.sparkles className="size-4" />}
        variant="outline"
      />
    </div>
  )
}
