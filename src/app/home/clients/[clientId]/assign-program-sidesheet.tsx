"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import LoadingButton from "@/components/loading-button"
import { ProgramPicker } from "@/components/program-dropdown-picker"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import apiAssignProgramToClient from "@/fetches/assign-program-to-client"
import type { Program } from "@/lib/domain/workouts"

interface Props {
  clientId: string
  programs: Program[]
}

export function AssignProgramSidesheet({ clientId, programs }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProgramId, setSelectedProgramId] = useState("")
  const router = useRouter()
  const handleAssignProgram = async () => {
    setIsLoading(true)

    const { error } = await apiAssignProgramToClient({
      clientId,
      programId: selectedProgramId,
    })
    if (error) {
      toast("Error assigning program", {
        description: error.message,
      })
      setIsLoading(false)
      return
    }
    toast("Program assigned", {})
    setIsLoading(false)
    setIsOpen(false)
    router.refresh()
  }
  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        <LoadingButton
          isLoading={isLoading}
          onClick={() => {
            setIsOpen(true)
          }}
          variant="outline"
        >
          Assign program
        </LoadingButton>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Assign Program</SheetTitle>
          <SheetDescription>Assign a program to this client</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <ProgramPicker
            handleSelect={({ value }) => {
              setSelectedProgramId(value)
            }}
            programs={programs}
          />
        </div>
        <SheetFooter>
          <Button onClick={handleAssignProgram}>Assign</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
