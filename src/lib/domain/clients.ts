import type { Program } from "./workouts"

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
