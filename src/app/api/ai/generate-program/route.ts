import 'server-only'

import { AIWorkout } from '@/lib/domain/workouts'
import { sleep } from '@/lib/utils/util'
import { NextRequest, NextResponse } from 'next/server'
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
  return `This is the client's profile: ${clientProfile} ${genUserPrompt({ workoutNumber, totalNumDays })}`
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
  workout: AIWorkout
}) => {
  return `JSON for Workout day ${dayNum}: ${JSON.stringify(workout)}`
}

const user = 'user' as const
const assistant = 'assistant' as const

interface WorkoutResponse {
  workouts: AIWorkout[]
}

export async function POST(
  request: NextRequest
): Promise<APIRouteHandlerResponse<WorkoutResponse>> {
  await sleep(2000)
  // mock response
  return NextResponse.json({
    data: JSON.parse(
      `
{
  "workouts": [
    {
      "name": "Strength Workout 1 - Vinson Li",
      "blocks": [
        {
          "exercise_name": "Incline Dumbbell Press",
          "sets": "4",
          "reps": "8-10",
          "weight": "50.00",
          "rest": "90s",
          "notes": "Focus on a full range of motion without overstressing the shoulders."
        },
        {
          "exercise_name": "Single-Leg Leg Press",
          "sets": "3",
          "reps": "10-12",
          "weight": "70.00",
          "rest": "60s",
          "notes": "Ensure to keep the knee aligned and push through the heel."
        },
        {
          "exercise_name": "Bent-Over Dumbbell Row",
          "sets": "4",
          "reps": "8-10",
          "weight": "45.00",
          "rest": "90s",
          "notes": "Maintain a flat back and engage the core throughout the movement."
        },
        {
          "exercise_name": "Dumbbell Romanian Deadlift",
          "sets": "3",
          "reps": "10-12",
          "weight": "40.00",
          "rest": "60s",
          "notes": "Focus on a slow eccentric phase to increase time under tension."
        },
        {
          "exercise_name": "Standing Dumbbell Shoulder Press (Neutral Grip)",
          "sets": "3",
          "reps": "8-10",
          "weight": "35.00",
          "rest": "90s",
          "notes": "Limit overhead stress by using a neutral grip."
        },
        {
          "exercise_name": "Plank (Weighted Optional)",
          "sets": "3",
          "reps": "30-45s",
          "weight": "0.00",
          "rest": "60s",
          "notes": "Engage the core and keep the body in a straight line from head to heels."
        },
        {
          "exercise_name": "Seated Calf Raise",
          "sets": "4",
          "reps": "12-15",
          "weight": "30.00",
          "rest": "60s",
          "notes": "Control the movement for better muscle engagement."
        }
      ]
    },
    {
      "name": "Strength Workout 2 - Vinson Li",
      "blocks": [
        {
          "exercise_name": "Barbell Bench Press",
          "sets": "4",
          "reps": "6-8",
          "weight": "135.00",
          "rest": "90s",
          "notes": "Focus on control during the descent to maximize muscle engagement."
        },
        {
          "exercise_name": "Hex Bar Deadlift",
          "sets": "3",
          "reps": "6-8",
          "weight": "185.00",
          "rest": "90s",
          "notes": "Use a hex bar to ensure a better position and reduce lower back strain."
        },
        {
          "exercise_name": "Pull-Ups (Assisted if necessary)",
          "sets": "3",
          "reps": "6-8",
          "weight": "0.00",
          "rest": "90s",
          "notes": "Use assistance if unable to do bodyweight pull-ups comfortably."
        },
        {
          "exercise_name": "Goblet Squat with Dumbbell",
          "sets": "3",
          "reps": "10-12",
          "weight": "40.00",
          "rest": "60s",
          "notes": "Ensure squat depth is adjusted to avoid discomfort, focusing on form."
        },
        {
          "exercise_name": "Dumbbell Lateral Raises",
          "sets": "3",
          "reps": "12-15",
          "weight": "15.00",
          "rest": "60s",
          "notes": "Maintain a slight bend in the elbows and control the ascent and descent."
        },
        {
          "exercise_name": "Ab Wheel Rollout (Kneeling)",
          "sets": "3",
          "reps": "8-10",
          "weight": "0.00",
          "rest": "60s",
          "notes": "Perform slowly to emphasize core stabilization."
        },
        {
          "exercise_name": "Leg Press (Feet High)",
          "sets": "4",
          "reps": "10-12",
          "weight": "150.00",
          "rest": "60s",
          "notes": "Position feet high on the platform to emphasize glute and hamstring engagement."
        }
      ]
    },
    {
      "name": "Strength Workout 3 - Vinson Li",
      "blocks": [
        {
          "exercise_name": "Dumbbell Bench Press",
          "sets": "4",
          "reps": "8-10",
          "weight": "55.00",
          "rest": "90s",
          "notes": "Keep a controlled motion and avoid overextending at the shoulder."
        },
        {
          "exercise_name": "Single-Leg Deadlift",
          "sets": "3",
          "reps": "8-10",
          "weight": "40.00",
          "rest": "60s",
          "notes": "Focus on balance and maintaining a flat back throughout the lift."
        },
        {
          "exercise_name": "Lat Pulldown (Wide Grip)",
          "sets": "4",
          "reps": "10-12",
          "weight": "80.00",
          "rest": "90s",
          "notes": "Engage the back muscles, pulling down to the upper chest."
        },
        {
          "exercise_name": "Goblet Squat (Regressed)",
          "sets": "3",
          "reps": "10-12",
          "weight": "35.00",
          "rest": "60s",
          "notes": "Use a lighter weight and focus on squat depth without compromising form."
        },
        {
          "exercise_name": "Dumbbell Lateral Raise",
          "sets": "3",
          "reps": "12-15",
          "weight": "20.00",
          "rest": "60s",
          "notes": "Control the movement to avoid swinging and prevent shoulder strain."
        },
        {
          "exercise_name": "Russian Twist",
          "sets": "3",
          "reps": "12-15",
          "weight": "15.00",
          "rest": "60s",
          "notes": "Engage the core fully; slow and steady movement is key."
        },
        {
          "exercise_name": "Seated Calf Raise",
          "sets": "4",
          "reps": "12-15",
          "weight": "35.00",
          "rest": "60s",
          "notes": "Focus on a full range of motion to optimize calf engagement."
        }
      ]
    }
  ]
}

    `
    ),
    error: null,
  })
  // const body = await request.json()
  // console.log({ body })
  // const { totalNumDays, clientInfo } = body
  //
  // // Generate the workouts day by day with open ai!
  // const initialContext = {
  //   role: user,
  //   content: generateInitialUserPrompt({
  //     clientProfile: clientInfo,
  //     workoutNumber: 1,
  //     totalNumDays,
  //   }),
  // }
  // console.log(JSON.stringify(initialContext, null, 2))
  // const { data: workoutDay1, error } = await generateWorkout({
  //   context: [initialContext],
  // })
  // if (error) {
  //   return InternalErrorRes(
  //     new InternalError('API network issue', { cause: error })
  //   )
  // }
  // const resp: WorkoutResponse = { workouts: [workoutDay1] }
  // let context = [
  //   initialContext,
  //   {
  //     role: assistant,
  //     content: workoutAssistantPrompt({ dayNum: 1, workout: workoutDay1 }),
  //   },
  // ]
  //
  // for (let i = 2; i < totalNumDays + 1; i++) {
  //   const workoutDay = i
  //   const nextContext = [
  //     ...context,
  //     {
  //       role: user,
  //       content: genUserPrompt({
  //         workoutNumber: workoutDay,
  //         totalNumDays: totalNumDays,
  //       }),
  //     },
  //   ]
  //   console.log(JSON.stringify(nextContext, null, 2))
  //   const { data, error } = await generateWorkout({
  //     context: nextContext,
  //   })
  //   if (error) {
  //     return InternalErrorRes(
  //       new InternalError('API network issue', { cause: error })
  //     )
  //   }
  //   resp.workouts = [...resp.workouts, data]
  //   context = [
  //     ...nextContext,
  //     {
  //       role: assistant,
  //       content: workoutAssistantPrompt({
  //         dayNum: workoutDay,
  //         workout: workoutDay1,
  //       }),
  //     },
  //   ]
  // }
  // console.log(JSON.stringify(resp, null, 2))
  // return NextResponse.json({ data: resp, error: null })
}
