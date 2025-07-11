import { streamObject } from "ai"
import { myProvider } from "@/lib/ai/providers"
import { workoutChangeSchema } from "@/lib/ai/tools/diff-schema"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30
const diffGenerationSystemPrompt = `You are given an original workout program in json and text format, and an updated workout program in text format.

<ORIGINAL_WORKOUT_JSON>
[
  {
    "id": "d6203068-4bda-4a48-9303-fb21578378e1",
    "program_order": 0,
    "program_id": "9cbddfa6-7daf-41a8-a8a3-a43f234285e2",
    "name": "workout 1",
    "blocks": [
      {
        "type": "exercise",
        "exercise": {
          "id": "381facbb-912c-4212-9842-9d173be77fd0",
          "name": "Double Leg Calf Raise w/Step",
          "metadata": {
            "sets": "3",
            "reps": "12",
            "weight": "100",
            "rest": "30s"
          }
        }
      },
      {
        "type": "exercise",
        "exercise": {
          "id": "5fdd9135-cd45-4695-8968-b62a0f34c757",
          "name": "Single Leg Calf Raise w/Step",
          "metadata": {
            "sets": "3",
            "reps": "12",
            "weight": "100",
            "rest": "30s"
          }
        }
      },
      {
        "type": "circuit",
        "circuit": {
          "isDefault": false,
          "name": "Circuit 1",
          "description": "Circuit 1 description",
          "metadata": {
            "sets": "3",
            "rest": "30s",
            "notes": "Circuit 1 notes"
          },
          "exercises": [
            {
              "type": "exercise",
              "exercise": {
                "id": "b4711ec3-d3b5-43ef-a2bd-a29d6bfd4caa",
                "name": "Calf Raises w/Knees Bent",
                "metadata": {
                  "sets": "3",
                  "reps": "12",
                  "weight": "100",
                  "rest": "30s"
                }
              }
            },
            {
              "type": "exercise",
              "exercise": {
                "id": "149beb8e-245b-434e-81e9-f53507bf2381",
                "name": "Heel Elevated Squats",
                "metadata": {
                  "sets": "3",
                  "reps": "12",
                  "weight": "100",
                  "rest": "30s"
                }
              }
            }
          ]
        }
      }
    ]
  }
]
</ORIGINAL_WORKOUT_JSON>

<UPDATED_WORKOUT_TEXT>
I have added the Hip Thrust exercise to the current workout program to further enhance glute activation and overall lower body strength. This addition will complement the existing exercises and provide a more balanced workout for the posterior chain.

Here’s the complete updated workout:

**Workout 1: workout 1 (ID: d6203068-4bda-4a48-9303-fb21578378e1)**
- Double Leg Calf Raise w/Step (ID: 381facbb-912c-4212-9842-9d173be77fd0)
  Sets: 3
  Reps: 12
  Weight: 100
  Rest: 30s

- Single Leg Calf Raise w/Step (ID: 5fdd9135-cd45-4695-8968-b62a0f34c757)
  Sets: 3
  Reps: 12
  Weight: 100
  Rest: 30s

- Circuit: Circuit 1
  Sets: 3
  Rest: 30s
  Exercises:
    - Calf Raises w/Knees Bent (ID: b4711ec3-d3b5-43ef-a2bd-a29d6bfd4caa)
      Sets: 3
      Reps: 12
      Weight: 100
      Rest: 30s

    - Heel Elevated Squats (ID: 149beb8e-245b-434e-81e9-f53507bf2381)
      Sets: 3
      Reps: 12
      Weight: 100
      Rest: 30s

    - Hip Thrusts (ID: 36e83a00-e473-459b-89af-a73f90209f67)
      Sets: 3
      Reps: 12
      Weight: 100
      Rest: 30s
</UPDATED_WORKOUT_TEXT>

Return a json array of changes that were made to the original workout program. Make sure that the json adheres to the schema provided.

There are 6 different types of changes that can be made to the workout program:
- replace-block
- add-block
- remove-block
- add-circuit-exercise
- remove-circuit-exercise
- replace-circuit-exercise

Here is an example of the different types of changes that can be made to the workout program:

{
  "type": "replace-block",
  "blockIndex": 0,
  "block": ... // The block to replace with
}

{
  "type": "add-block",
  "afterBlockIndex": 0,
  "block": ... // The block to add
}

{
  "type": "remove-block",
  "blockIndex": 0
}

{
  "type": "add-circuit-exercise",
  "circuitBlockIndex": 0,
  "afterExerciseIndex": 0,
  "exercise": ... // The exercise to add
}

{
  "type": "remove-circuit-exercise",
  "circuitBlockIndex": 0,
  "exerciseIndex": 0
}

{
  "type": "replace-circuit-exercise",
  "circuitBlockIndex": 0,
  "exerciseIndex": 0,
  "exercise": ... // The exercise to replace with
}
`

export async function POST(req: Request) {
  const prompt = "generate a workout diff for the following changes"
  console.log("--------------------------------")
  console.log("Prompt:")
  console.log("--------------------------------")
  console.log(prompt)
  console.log("--------------------------------")
  console.log("Diff generation system prompt:")
  console.log("--------------------------------")
  console.log(diffGenerationSystemPrompt)
  console.log("--------------------------------")

  const { elementStream } = streamObject({
    model: myProvider.languageModel("chat-model"),
    schema: workoutChangeSchema,
    output: "array",
    system: diffGenerationSystemPrompt,
    prompt,
  })
  console.log("Diff generation streaming.")

  console.log("--------------------------------")
  console.log("Result:")
  console.log("--------------------------------")
  for await (const element of elementStream) {
    console.log(JSON.stringify(element, null, 2))
    console.log("--------------------------------")
  }
  console.log("--------------------------------")

  return new Response("done")
}
