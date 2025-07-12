import { v4 as uuidv4 } from "uuid"
import type { WorkoutChange } from "@/lib/ai/tools/diff-schema"
import type {
  Block,
  Blocks,
  CircuitBlock,
  Exercise,
  Program,
} from "@/lib/domain/workouts"

const newTestProposedChanges = (exercises: Exercise[]): WorkoutChange[] => {
  const changes: WorkoutChange[] = [
    {
      id: uuidv4(),
      type: "add-circuit-exercise",
      workoutIndex: 0,
      circuitBlockIndex: 3,
      exerciseIndex: 0,
      exercise: {
        type: "exercise",
        exercise: {
          id: exercises[4].id,
          name: exercises[4].name,
          metadata: {
            sets: "3",
            reps: "12",
            weight: "100",
            rest: "30s",
          },
        },
      },
    },
    {
      id: uuidv4(),
      type: "add-block",
      workoutIndex: 0,
      blockIndex: 0,
      block: {
        type: "exercise",
        exercise: {
          id: exercises[4].id,
          name: exercises[4].name,
          metadata: {
            sets: "3",
            reps: "12",
            weight: "100",
            rest: "30s",
          },
        },
      },
    },
    {
      id: uuidv4(),
      type: "update-block",
      workoutIndex: 0,
      blockIndex: 0,
      block: {
        type: "exercise",
        exercise: {
          id: exercises[7].id,
          name: exercises[7].name,
          metadata: {
            sets: "3",
            reps: "12",
            weight: "100",
            rest: "30s",
          },
        },
      },
    },
    {
      id: uuidv4(),
      type: "remove-block",
      workoutIndex: 0,
      blockIndex: 2,
    },
    {
      id: uuidv4(),
      type: "remove-circuit-exercise",
      workoutIndex: 0,
      circuitBlockIndex: 3,
      exerciseIndex: 0,
    },
  ]
  return changes
}

const newTestInitialProgram = (exercises: Exercise[]): Program => {
  const exerciseBlocks: Blocks = exercises
    .slice(0, 2)
    .map((exercise): Block => {
      return {
        type: "exercise",
        exercise: {
          id: exercise.id,
          name: exercise.name,
          metadata: {
            sets: "3",
            reps: "12",
            weight: "100",
            rest: "30s",
          },
        },
      }
    })

  const circuitBlock: CircuitBlock = {
    type: "circuit",
    circuit: {
      isDefault: false,
      name: "Circuit 1",
      description: "Circuit 1 description",
      metadata: {
        sets: "3",
        rest: "30s",
        notes: "Circuit 1 notes",
      },
      exercises: [
        {
          type: "exercise",
          exercise: {
            id: exercises[2].id,
            name: exercises[2].name,
            metadata: {
              sets: "3",
              reps: "12",
              weight: "100",
              rest: "30s",
            },
          },
        },
        {
          type: "exercise",
          exercise: {
            id: exercises[3].id,
            name: exercises[3].name,
            metadata: {
              sets: "3",
              reps: "12",
              weight: "100",
              rest: "30s",
            },
          },
        },
      ],
    },
  }

  const circuitBlock2: CircuitBlock = {
    type: "circuit",
    circuit: {
      isDefault: false,
      name: "Circuit 2",
      description: "Circuit 2 description",
      metadata: {
        sets: "3",
        rest: "30s",
        notes: "Circuit 2 notes",
      },
      exercises: [
        {
          type: "exercise",
          exercise: {
            id: exercises[6].id,
            name: exercises[6].name,
            metadata: {
              sets: "3",
              reps: "12",
              weight: "100",
              rest: "30s",
            },
          },
        },
        {
          type: "exercise",
          exercise: {
            id: exercises[7].id,
            name: exercises[7].name,
            metadata: {
              sets: "3",
              reps: "12",
              weight: "100",
              rest: "30s",
            },
          },
        },
      ],
    },
  }

  return {
    id: uuidv4().toString(),
    created_at: new Date().toISOString(),
    name: "New Program",
    type: "weekly",
    workouts: [
      {
        id: uuidv4().toString(),
        name: "workout 1",
        program_id: uuidv4().toString(), // populated on create
        program_order: 0,
        blocks: [...exerciseBlocks, circuitBlock, circuitBlock2],
      },
    ],
  }
}
export { newTestInitialProgram, newTestProposedChanges }
