import "server-only";

import OpenAI from "openai";
import { Workout, workoutSchema } from "./schema";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { v1 } from "../prompts/prompts";
import { sampleAPIResponse } from "./examples/sample_responses";
import { APIResponse } from "@/lib/types/apires";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateWorkout({
  prompt,
}: {
  prompt: string;
}): Promise<APIResponse<Workout>> {
  const sampleRes = sampleAPIResponse;
  const res = JSON.parse(sampleRes);
  const jsonRes = res.parsed;

  const { data, error } = workoutSchema.safeParse(jsonRes);
  if (error) {
    console.log({ error });
    return {
      error: new Error(error.message),
      data: null,
    };
  }
  console.log({data});
  return {
    data,
    error: null,
  };
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: v1,
        },
        {
          role: "user",
          content: `Here is the information from the client. Generate a workout plan in the specified format: ${prompt}`,
        },
      ],
      response_format: zodResponseFormat(workoutSchema, "workout_plan"),
      max_completion_tokens: 16384,
    });

    const workoutPlan = completion.choices[0].message;
    console.log("plan");
    console.log(JSON.stringify(workoutPlan, null, 2));
    if (workoutPlan.parsed) {
      console.log(workoutPlan.parsed);
    } else if (workoutPlan.refusal) {
      // handle refusal
      console.log(workoutPlan.refusal);
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      console.log(e.errors);
    } else if (e.constructor.name == "LengthFinishReasonError") {
      // Retry with a higher max tokens
      console.log("Too many tokens: ", e.message);
    } else {
      // Handle other exceptions
      console.log("An error occurred: ", e.message);
    }
  }
}

const testjson = `
{
  id: 1,
  name: "Full Body Workout",
  columns: [
    { type: "sets" },
    { type: "reps" },
    { type: "weight", units: "lb" },
    { type: "rest" }
  ],
  exercises: [{
    id: 1,
    type: "exercise",
    exercise: {
      id: 1,
      name: "Squat"
    },
    exercise_name: "Squat",
    metadata: [
      { type: "sets", value: "3" },
      { type: "reps", value: "10" },
      { type: "weight", value: "135", units: "lb" },
      { type: "rest", value: "90s" }
    ]
  }]
}
`;

export { generateWorkout };
