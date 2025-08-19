import z from "zod"
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
export interface ClientHomePage extends Client {
  programs: Program[]
  age: number
  liftingExperienceMonths: number
  gender: string
  weightKg: number
  heightCm: number
  details: ClientDetail[]
}
