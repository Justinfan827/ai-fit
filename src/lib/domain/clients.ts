import { z } from "zod"
import type { SparseProgram } from "./workouts"

export const basicClientSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
})

export type ClientBasic = z.infer<typeof basicClientSchema>

export interface Client {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
  // TODO: add avatarURL
  avatarURL?: string
}

export interface TrainerNote {
  id: string
  title: string
  description: string
}

export interface ValueWithUnit {
  value: number
  unit: string
}

export interface ClientWithTrainerNotes extends Client {
  trainerNotes: TrainerNote[]
}

export interface ClientHomePage extends Client {
  programs: SparseProgram[]
  age: number
  gender: string
  weight: ValueWithUnit
  height: ValueWithUnit
  trainerNotes: TrainerNote[]
}
