import { z } from "zod";
import { workoutSchema } from "../ai/openai/schema";

const exerciseSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const workoutPlanSchema = z.object({
  id: z.string(),
  planName: z.string(),
  workouts: z.array(
    z.object({
      order: z.number(), // index of workout, starting from 1
      data: workoutSchema,
    }),
  ),
});

type WorkoutPlan = z.infer<typeof workoutPlanSchema>;
type Exercise = z.infer<typeof exerciseSchema>;

export { exerciseSchema, workoutPlanSchema, type Exercise, type WorkoutPlan };
