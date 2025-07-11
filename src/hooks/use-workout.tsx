"use client"

import { createContext, useContext, useState } from "react"
import type { GenerateProgramSchema } from "@/lib/domain/workouts_ai_response"

interface AIGeneratedWorkoutsContext {
  generatedProgram: GenerateProgramSchema | undefined
  setGeneratedProgram: (p: GenerateProgramSchema) => void
  setIsPending: (p: boolean) => void
  isPending: boolean
  clearGeneratedProgram: () => void
}
const Context = createContext<AIGeneratedWorkoutsContext | undefined>(undefined)

interface AIGeneratedWorkoutsProviderProps {
  children: React.ReactNode
}

export default function AIGeneratedWorkoutsProvider({
  children,
}: AIGeneratedWorkoutsProviderProps) {
  const [generatedProgram, setGeneratedProgram] = useState<
    GenerateProgramSchema | undefined
  >(undefined)
  const [isPending, setIsPending] = useState(false)

  const clearGeneratedProgram = () => {
    setGeneratedProgram(undefined)
  }

  return (
    <Context.Provider
      value={{
        generatedProgram,
        setGeneratedProgram,
        isPending,
        setIsPending,
        clearGeneratedProgram,
      }}
    >
      <>{children}</>
    </Context.Provider>
  )
}

export const useAIGeneratedWorkouts = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error(
      "useAIGeneratedWorkouts() must be used inside AIGeneratedWorkoutsProvider"
    )
  }
  return context
}

// Keep the old export for backward compatibility during transition
export const useAIProgram = useAIGeneratedWorkouts
