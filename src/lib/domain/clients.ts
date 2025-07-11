import type { Program } from "./workouts"

export interface Client {
  id: string
  email: string
  firstName: string
  lastName: string
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
