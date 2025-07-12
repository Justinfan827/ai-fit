import "server-only"

import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { systemPrompt } from "@/lib/ai/prompts/prompts"
import {
  type GenerateProgramSchema,
  generateProgramSchema,
} from "@/lib/domain/workouts_ai_response"
import { sendDebugLog } from "@/lib/supabase/server/database.operations.mutations"
import type { APIResponse } from "@/lib/types/apires"
import { getError } from "@/lib/utils/util"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export default async function openaiGenerate({
  context = [],
}: {
  context: {
    role: "assistant" | "user"
    content: string
  }[]
}): Promise<APIResponse<GenerateProgramSchema>> {
  const messages: Array<ChatCompletionMessageParam> = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...context,
  ]
  console.log("\n\n\n")
  console.log("sending message")
  console.log(JSON.stringify(messages, null, 2))
  console.log("\n\n\n")
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages,
      response_format: zodResponseFormat(
        generateProgramSchema,
        "workout_program"
      ),
      max_completion_tokens: 16_384,
    })

    await sendDebugLog({
      response: completion,
    })

    if (completion.choices[0].finish_reason === "length") {
      // Handle the case where the model did not return a complete response
      throw new Error("Incomplete response")
    }
    const response = completion.choices[0].message

    if (response.refusal) {
      // handle refusal
      return {
        data: null,
        error: new Error(response.refusal),
      }
    }

    const { data: generatedProgram, error } = generateProgramSchema.safeParse(
      response.parsed
    )
    if (error) {
      return {
        data: null,
        error: new Error(error.message),
      }
    }
    return {
      data: generatedProgram,
      error: null,
    }
  } catch (e) {
    console.log("error in openai generation")
    console.log(e)
    // if (e instanceof z.ZodError) {
    //   console.log(e.errors)
    // } else if (e.constructor.name == 'LengthFinishReasonError') {
    //   // Retry with a higher max tokens
    //   console.log('Too many tokens: ', e.message)
    // } else {
    //   // Handle other exceptions
    //   console.log('An error occurred: ', e.message)
    // }
    return {
      error: getError(e),
      data: null,
    }
  }
}
