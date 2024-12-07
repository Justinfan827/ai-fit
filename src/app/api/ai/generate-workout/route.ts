import 'server-only'

import { generateWorkout } from '@/lib/ai/openai/client'
import { Workout } from '@/lib/ai/openai/schema'
import { NextRequest, NextResponse } from 'next/server'
import { InternalError, InternalErrorRes } from '../../errors'
import { APIRouteHandlerResponse } from '../../types'

const generateInitialUserPrompt = ({
  clientProfile,
  workoutNumber,
  totalNumDays,
}: {
  clientProfile: string
  workoutNumber: number
  totalNumDays: number
}) => {
  return `This is client's profile: ${clientProfile} ${genUserPrompt({ workoutNumber, totalNumDays })}`
}

const genUserPrompt = ({
  workoutNumber,
  totalNumDays,
}: {
  workoutNumber: number
  totalNumDays: number
}) => {
  return `Generate workout number ${workoutNumber} of ${totalNumDays} for the client`
}

const workoutAssistantPrompt = ({
  workout,
  dayNum,
}: {
  dayNum: number
  workout: Workout
}) => {
  return `JSON for Workout day ${dayNum}: ${JSON.stringify(workout)}`
}

const user = 'user' as const
const assistant = 'assistant' as const

interface WorkoutResponse {
  workouts: Workout[]
}

export async function POST(
  request: NextRequest
): Promise<APIRouteHandlerResponse<WorkoutResponse>> {
  const body = await request.json()
  const { totalNumDays, clientInfo } = body

  // Generate the workouts day by day with open ai!
  const initialContext = {
    role: user,
    content: generateInitialUserPrompt({
      clientProfile: clientInfo,
      workoutNumber: 1,
      totalNumDays,
    }),
  }

  const { data: workoutDay1, error } = await generateWorkout({
    context: [initialContext],
  })
  if (error) {
    return InternalErrorRes(
      new InternalError('Ansa API network issue', { cause: error })
    )
  }
  const resp: WorkoutResponse = { workouts: [workoutDay1] }
  let context = [
    initialContext,
    {
      role: assistant,
      content: workoutAssistantPrompt({ dayNum: 1, workout: workoutDay1 }),
    },
  ]

  for (let i = 2; i < totalNumDays + 1; i++) {
    const workoutDay = i
    const nextContext = [
      ...context,
      {
        role: user,
        content: genUserPrompt({
          workoutNumber: workoutDay,
          totalNumDays: totalNumDays,
        }),
      },
    ]
    const { data, error } = await generateWorkout({
      context: nextContext,
    })
    if (error) {
      return InternalErrorRes(
        new InternalError('Ansa API network issue', { cause: error })
      )
    }
    resp.workouts = [...resp.workouts, data]
    context = [
      ...nextContext,
      {
        role: assistant,
        content: workoutAssistantPrompt({
          dayNum: workoutDay,
          workout: workoutDay1,
        }),
      },
    ]
  }
  return NextResponse.json({ data: resp, error: null })
}
