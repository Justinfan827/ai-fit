import { streamObject } from "ai"
import { myProvider } from "@/lib/ai/providers"
import { workoutChangeSchema } from "@/lib/ai/tools/diff-schema"
import log from "@/lib/logger/logger"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30
const diffGenerationSystemPrompt = `
You are given an original workout program in json and text format, and an updated workout program in text format.

<ORIGINAL_WORKOUT_JSON>
[
  {
    "id": "4e8b7a81-44f4-4bde-a985-465b77dbfba4",
    "program_order": 0,
    "program_id": "cf0ac9d8-7462-4ab5-92dc-7429133c10be",
    "name": "workout 1",
    "blocks": [
      {
        "type": "exercise",
        "exercise": {
          "id": "516e0990-972e-496d-b4d1-4950d4c54451",
          "name": "Leg Extensions",
          "metadata": {
            "sets": "3",
            "reps": "12",
            "weight": "100",
            "rest": "30s"
          }
        },
        "pendingStatus": {
          "type": "adding",
          "proposalId": "7c6340ba-b3a5-4665-bf61-d3e341e14fc8"
        }
      },
      {
        "type": "exercise",
        "exercise": {
          "id": "43338045-a2de-4f4a-b0f8-4f2d0c50eeaf",
          "name": "Split Squats",
          "metadata": {
            "sets": "3",
            "reps": "12",
            "weight": "100",
            "rest": "30s"
          }
        },
        "pendingStatus": {
          "type": "updating",
          "oldBlock": {
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
          "proposalId": "a91db429-eeac-4532-881f-d8ee18caf2b7"
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
        },
        "pendingStatus": {
          "type": "removing",
          "proposalId": "2cbd9722-99b5-44f4-895a-608e1d2fced9"
        }
      },
      {
        "type": "circuit",
        "circuit": {
          "isDefault": false,
          "name": "Circuit 2",
          "description": "Circuit 2 description",
          "metadata": {
            "sets": "3",
            "rest": "30s",
            "notes": "Circuit 2 notes"
          },
          "exercises": [
            {
              "type": "exercise",
              "exercise": {
                "id": "516e0990-972e-496d-b4d1-4950d4c54451",
                "name": "Leg Extensions",
                "metadata": {
                  "sets": "3",
                  "reps": "12",
                  "weight": "100",
                  "rest": "30s"
                }
              },
              "pendingStatus": {
                "type": "adding",
                "proposalId": "8c4b7d26-a0e9-45b8-bf6c-aac67e214692"
              }
            },
            {
              "type": "exercise",
              "exercise": {
                "id": "fdd06654-a295-4b72-a2fb-b1585fcb3dc5",
                "name": "Reverse Lunges",
                "metadata": {
                  "sets": "3",
                  "reps": "12",
                  "weight": "100",
                  "rest": "30s"
                }
              },
              "pendingStatus": {
                "type": "removing",
                "proposalId": "6db590c6-29ab-48ef-8f32-77bb4a7e0be6"
              }
            },
            {
              "type": "exercise",
              "exercise": {
                "id": "43338045-a2de-4f4a-b0f8-4f2d0c50eeaf",
                "name": "Split Squats",
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
I've added the two leg exercises, Walking Lunges and Hip Thrusts, to your circuit. Here’s the complete updated workout program:

**Workout 1: workout 1 (ID: 4e8b7a81-44f4-4bde-a985-465b77dbfba4)**

- Leg Extensions (ID: 516e0990-972e-496d-b4d1-4950d4c54451)
  Sets: 3
  Reps: 12
  Weight: 100
  Rest: 30s

- Split Squats (ID: 43338045-a2de-4f4a-b0f8-4f2d0c50eeaf)
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

    - Walking Lunges (ID: cac69f34-f8c1-42ba-bcfc-282028d2ada5)
      Sets: 3
      Reps: 12 (each leg)
      Weight: Bodyweight or light dumbbells
      Rest: 30s

    - Hip Thrusts (ID: 36e83a00-e473-459b-89af-a73f90209f67)
      Sets: 3
      Reps: 12
      Weight: Moderate weight
      Rest: 30s

- Circuit: Circuit 2
  Sets: 3
  Rest: 30s
  Exercises:
    - Leg Extensions (ID: 516e0990-972e-496d-b4d1-4950d4c54451)
      Sets: 3
      Reps: 12
      Weight: 100
      Rest: 30s

    - Reverse Lunges (ID: fdd06654-a295-4b72-a2fb-b1585fcb3dc5)
      Sets: 3
      Reps: 12
      Weight: 100
      Rest: 30s

    - Split Squats (ID: 43338045-a2de-4f4a-b0f8-4f2d0c50eeaf)
      Sets: 3
      Reps: 12
      Weight: 100
      Rest: 30s

Feel free to let me know if you need any further modifications or assistance!
</UPDATED_WORKOUT_TEXT>

Return a json array of changes that were made to the original workout program. Make sure that the json adheres to the schema provided.

There are 6 different types of changes that can be made to the workout program:
- update-block
- add-block
- remove-block
- add-circuit-exercise
- remove-circuit-exercise
- update-circuit-exercise

Here is an example of the different types of changes that can be made to the workout program:

{
  "type": "update-block",
  "workoutIndex": 0,
  "blockIndex": 0,
  "block": ... // The updated block
}

{
  "type": "add-block",
  "workoutIndex": 0,
  "afterBlockIndex": 0,
  "block": ... // The block to add
}

{
  "type": "remove-block",
  "workoutIndex": 0,
  "blockIndex": 0
}

{
  "type": "add-circuit-exercise",
  "workoutIndex": 0,
  "circuitBlockIndex": 0,
  "afterExerciseIndex": 0,
  "exercise": ... // The exercise to add
}

{
  "type": "remove-circuit-exercise",
  "workoutIndex": 0,
  "circuitBlockIndex": 0,
  "exerciseIndex": 0
}

{
  "type": "update-circuit-exercise",
  "workoutIndex": 0,
  "circuitBlockIndex": 0,
  "exerciseIndex": 0,
  "exercise": ... // The updated exercise
}

`

export async function POST(req: Request) {
  const prompt = "generate a workout diff for the following changes"
  log.consoleWithHeader("Prompt:", prompt)
  log.consoleWithHeader(
    "Diff generation system prompt:",
    diffGenerationSystemPrompt
  )

  const { fullStream, warnings } = streamObject({
    model: myProvider.languageModel("chat-model"),
    schema: workoutChangeSchema,
    output: "array",
    system: diffGenerationSystemPrompt,
    prompt,
  })
  log.consoleWithHeader("Diff generation streaming.")

  log.consoleWithHeader("Result:")
  for await (const element of fullStream) {
    log.console(element)
  }
  log.consoleWithHeader("Warnings:", await warnings)

  return new Response("done")
}
