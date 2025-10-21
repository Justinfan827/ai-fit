import { z } from "zod"
import { sparseProgramSchema } from "./workouts"

const weightSchema = z.object({
  value: z.number(),
  unit: z.enum(["kg", "lbs"]),
})

const weightString = (weight: z.infer<typeof weightSchema>) => {
  return `${weight.value} ${weight.unit}`
}

const heightSchema = z.object({
  value: z.number(),
  unit: z.enum(["cm", "in"]),
})

const heightString = (height: z.infer<typeof heightSchema>) => {
  // if inches, return ft and inches
  if (height.unit === "in") {
    const feet = Math.floor(height.value / 12)
    const inches = height.value % 12
    return `${feet} ft ${inches} in`
  }
  // if cm, return cm
  return `${Math.round(height.value)} cm`
}

const trainerNoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
})

const clientBasicSchema = z.object({
  id: z.string(),
  avatarURL: z.string(),
  createdAt: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
})

const clientDetailedSchema = clientBasicSchema.extend({
  age: z.number(),
  gender: z.enum(["male", "female"]),
  weight: weightSchema,
  height: heightSchema,
  trainerNotes: z.array(trainerNoteSchema),
})

const clientHomePageSchema = clientDetailedSchema.extend({
  programs: z.array(sparseProgramSchema),
})

type TrainerNote = z.infer<typeof trainerNoteSchema>
type ClientBasic = z.infer<typeof clientBasicSchema>
type ValueWithUnit = z.infer<typeof weightSchema> | z.infer<typeof heightSchema>
type ClientDetailed = z.infer<typeof clientDetailedSchema>
type ClientHomePage = z.infer<typeof clientHomePageSchema>

export { clientBasicSchema, clientDetailedSchema, heightString, weightString }
export type {
  TrainerNote,
  ClientDetailed,
  ValueWithUnit,
  ClientBasic,
  ClientHomePage,
}
