'use client'

import { AIProgram } from '@/lib/domain/workouts'
import { createContext, useContext, useState } from 'react'

interface AIProgramContext {
  program: AIProgram | undefined
  setProgram: (p: AIProgram) => void
  setIsPending: (p: boolean) => void
  isPending: boolean
}
const Context = createContext<AIProgramContext | undefined>(undefined)

interface TableProviderProps {
  children: React.ReactNode
}

export default function AIProgramProvider({ children }: TableProviderProps) {
  const [program, setProgram] = useState<AIProgram | undefined>(undefined)
  const [isPending, setIsPending] = useState(false)
  return (
    <Context.Provider
      value={{
        program,
        setProgram,
        isPending,
        setIsPending,
      }}
    >
      <>{children}</>
    </Context.Provider>
  )
}

export const useAIProgram = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useWorkout() must be used inside ProgramProvider')
  }
  return context
}
