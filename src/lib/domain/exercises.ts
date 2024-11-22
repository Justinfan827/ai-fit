import { z } from "zod";

const exerciseSchema = z.object({
  id: z.number(),
  name: z.string(),
});

type Exercise = z.infer<typeof exerciseSchema>;

export {
  type Exercise,
  exerciseSchema,
}
