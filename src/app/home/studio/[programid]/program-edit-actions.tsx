"use client"
import { useTransition } from "react"
import { toast } from "sonner"
import { updateProgramAction } from "@/actions/save-program"
import { Icons } from "@/components/icons"
import LoadingButton from "@/components/loading-button"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import {
  useZProgramCreatedAt,
  useZProgramId,
  useZProgramName,
  useZProgramType,
  useZProgramWorkouts,
} from "@/hooks/zustand/program-editor-state"
import { cn } from "@/lib/utils"

export default function ProgramActions() {
  const { open } = useSidebar()
  const [isPending, startTransition] = useTransition()
  const programId = useZProgramId()
  const programName = useZProgramName()
  const programType = useZProgramType()
  const workouts = useZProgramWorkouts()
  const createdAt = useZProgramCreatedAt()

  const handleSaveProgram = () => {
    startTransition(async () => {
      try {
        const program = {
          id: programId,
          name: programName,
          type: programType,
          workouts,
          created_at: createdAt,
        }

        const result = await updateProgramAction(program)
        if (result.error) {
          toast("Failed to save program. Please try again.")
        } else {
          toast("Program saved successfully!")
        }
      } catch (_) {
        toast("Failed to save program. Please try again.")
      }
    })
  }
  return (
    <div className="flex items-center justify-center space-x-2">
      <LoadingButton
        className="w-20"
        isLoading={isPending}
        onClick={handleSaveProgram}
        variant="outline"
      >
        Save
      </LoadingButton>
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
