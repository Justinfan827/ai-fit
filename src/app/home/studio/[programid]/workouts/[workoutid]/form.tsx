// import type { useForm } from "react-hook-form"
// import { z } from "zod"
//
// export type WorkoutInstanceFormValues = z.infer<
//   typeof WorkoutInstanceFormSchema
// >
// export const WorkoutInstanceFormSchema = z.object({
//   exercises: z.array(
//     z.object({
//       sets: z.array(
//         z.object({
//           exercise_id: z.string(),
//           reps: z.string(),
//           weight: z.string(),
//           rest: z.string(),
//           notes: z.string(),
//         })
//       ),
//     })
//   ),
// })
// export type WorkoutForm = ReturnType<typeof useForm<WorkoutInstanceFormValues>>
