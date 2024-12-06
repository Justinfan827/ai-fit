import "server-only";

import { WorkoutPlan } from "@/lib/domain/exercises";
import { APIResponse } from "@/lib/types/apires";
import { randomUUID } from "crypto";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { v1 } from "../prompts/prompts";
import { Workout, workoutSchema } from "./schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateWorkout({
  context,
}: {
  context: {
    role: "assistant" | "user";
    content: string;
  }[];
}): Promise<APIResponse<Workout>> {
  // const sampleRes = sampleAPIResponse;
  // const res = JSON.parse(sampleRes);
  // const jsonRes = res.parsed;
  // console.log({ jsonRes });
  //
  // const { data, error } = workoutSchema.safeParse(jsonRes);
  // console.log({ data });
  // console.log({ error });
  // if (error) {
  //   console.log({ error });
  //   return {
  //     error: new Error(error.message),
  //     data: null,
  //   };
  // }
  // return {
  //   data: {
  //     id: "workout-plan-1",
  //     planName: "Justin's workout plan",
  //     workouts: [
  //       {
  //         order: 1,
  //         data,
  //       },
  //       {
  //         order: 2,
  //         data: {
  //           ...data,
  //           id: 123413,
  //         },
  //       },
  //     ],
  //   },
  //   error: null,
  // };
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: v1,
        },
        ...context,
      ],
      response_format: zodResponseFormat(workoutSchema, "workout_plan"),
      max_completion_tokens: 16384,
    });

    const aiGeneratedPlan = completion.choices[0].message;
    if (aiGeneratedPlan.parsed) {
      console.log("\n\n\n");
      console.log("successful plan generations");
      console.log(JSON.stringify(aiGeneratedPlan, null, 2));
      console.log("\n\n\n");
      const { data: verifiedPlan, error } =
        workoutSchema.safeParse(aiGeneratedPlan);
      if (error) {
        console.log("error in generating workout schema");
        console.log(JSON.stringify(error, null, 2));
        return {
          data: null,
          error: new Error(error.message),
        };
      }
      return {
        data: {
          id: randomUUID().toString(),
          planName: "Auto generated workout plan",
          workouts: [
            {
              order: 1,
              data: verifiedPlan,
            },
            {
              order: 2,
              data: {
                ...verifiedPlan,
                id: 123413,
              },
            },
          ],
        },
        error: null,
      };
    } else if (aiGeneratedPlan.refusal) {
      // handle refusal
      console.log(aiGeneratedPlan.refusal);
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

export { generateWorkout };
