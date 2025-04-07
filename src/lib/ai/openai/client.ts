import 'server-only'

import { AIWorkout, aiWorkoutSchema } from '@/lib/domain/workouts'
import { APIResponse } from '@/lib/types/apires'
import { getError } from '@/lib/utils/util'
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { systemPromptv1 } from '../prompts/prompts'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function generateWorkout({
  context,
}: {
  context: {
    role: 'assistant' | 'user'
    content: string
  }[]
}): Promise<APIResponse<AIWorkout>> {
  const messages: Array<ChatCompletionMessageParam> = [
    {
      role: 'system',
      content: systemPromptv1,
    },
    ...context,
  ]
  console.log('\n\n\n')
  console.log('sending message')
  console.log(JSON.stringify(messages, null, 2))
  console.log('\n\n\n')
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages,
      response_format: zodResponseFormat(aiWorkoutSchema, 'workout'),
      max_completion_tokens: 16384,
    })

    console.log({ completion })
    const aiGeneratedPlan = completion.choices[0].message
    if (aiGeneratedPlan.parsed) {
      console.log('\n\n\n')
      console.log('successful plan generation')
      console.log(JSON.stringify(aiGeneratedPlan.parsed, null, 2))
      console.log('\n\n\n')
      const { data: verifiedPlan, error } = aiWorkoutSchema.safeParse(
        aiGeneratedPlan.parsed
      )
      if (error) {
        console.log('error in generating workout schema')
        console.log(JSON.stringify(error, null, 2))
        return {
          data: null,
          error: new Error(error.message),
        }
      }
      return {
        data: verifiedPlan,
        error: null,
      }
    } else if (aiGeneratedPlan.refusal) {
      // handle refusal
      console.log(aiGeneratedPlan.refusal)
      return {
        data: null,
        error: new Error(aiGeneratedPlan.refusal),
      }
    }
    return {
      data: null,
      error: new Error('No workout generated'),
    }
  } catch (e) {
    console.log('\n\n\n')
    console.log('catching error')
    console.log({ e })
    console.log('\n\n\n')
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

export { generateWorkout }

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
