import { z } from "zod"
import type { Program } from "./workouts"

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

export interface ClientDetail {
  id: string
  title: string
  description: string
}

export interface TrainerClientNote {
  id: string
  trainerId: string
  clientId: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
}
export interface ClientHomePage extends Client {
  programs: Program[]
  age: number
  liftingExperienceMonths: number
  gender: string
  // Biometric data - always normalized to metric units for consistency
  weightKg: number // Converted from stored weight_value + weight_unit
  heightCm: number // Converted from stored height_value + height_unit
  // Legacy details from metadata - now handled by trainerNotes
  details: ClientDetail[]
  // Trainer notes from the trainer_client_notes table
  trainerNotes: TrainerClientNote[]
}
