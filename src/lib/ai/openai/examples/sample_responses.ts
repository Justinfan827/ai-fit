export const sampleAPIResponse = `
{
  "role": "assistant",
  "refusal": null,
  "tool_calls": [],
  "parsed": {
    "id": 1,
    "name": "3x Weekly Arm Building Program",
    "columns": [
      {
        "type": "sets",
        "units": "sets"
      },
      {
        "type": "reps",
        "units": "reps"
      },
      {
        "type": "weight",
        "units": "kg"
      },
      {
        "type": "rpe",
        "units": ""
      },
      {
        "type": "rest",
        "units": "seconds"
      },
      {
        "type": "notes",
        "units": ""
      }
    ],
    "exercises": [
      {
        "id": 1,
        "type": "warmup",
        "exercise": null,
        "exercise_name": "Thread the needle",
        "metadata": [
          {
            "type": "reps",
            "value": "12",
            "units": ""
          },
          {
            "type": "weight",
            "value": "5-10",
            "units": "kg"
          },
          {
            "type": "rpe",
            "value": "6",
            "units": ""
          },
          {
            "type": "sets",
            "value": "3",
            "units": ""
          },
          {
            "type": "notes",
            "value": "Routine to prepare for upper body workouts.",
            "units": ""
          }
        ],
        "notes": "5-10 minutes of arm circles, shoulder dips, torso twists, and light jogging."
      },
      {
        "id": 2,
        "type": "exercise",
        "exercise": {
          "id": 1,
          "name": "Bicep Curl (Dumbbells)",
          "description": "Standing or seated, lift dumbbells towards shoulders, contracting the biceps.",
          "focus": "Bicep Strength"
        },
        "exercise_name": "Bicep Curl",
        "metadata": [
          {
            "type": "sets",
            "value": "3",
            "units": ""
          },
          {
            "type": "reps",
            "value": "12",
            "units": ""
          },
          {
            "type": "weight",
            "value": "5-10",
            "units": "kg"
          },
          {
            "type": "rpe",
            "value": "6",
            "units": ""
          },
          {
            "type": "rest",
            "value": "60",
            "units": ""
          },
          {
            "type": "notes",
            "value": "Keep elbows close to the torso during the movement.",
            "units": ""
          }
        ],
        "notes": "Targets the biceps for growth."
      },
      {
        "id": 3,
        "type": "exercise",
        "exercise": {
          "id": 2,
          "name": "Tricep Dips (Bench)",
          "description": "Using a bench, lower and raise your body using your arms.",
          "focus": "Tricep Strength"
        },
        "exercise_name": "Tricep Dips",
        "metadata": [
          {
            "type": "sets",
            "value": "3",
            "units": ""
          },
          {
            "type": "reps",
            "value": "10",
            "units": ""
          },
          {
            "type": "weight",
            "value": "bodyweight",
            "units": ""
          },
          {
            "type": "rpe",
            "value": "7",
            "units": ""
          },
          {
            "type": "rest",
            "value": "60",
            "units": ""
          },
          {
            "type": "notes",
            "value": "If needed, keep feet on floor for less intensity.",
            "units": ""
          }
        ],
        "notes": "Develops the triceps for balanced arm growth."
      },
      {
        "id": 4,
        "type": "exercise",
        "exercise": {
          "id": 3,
          "name": "Hammer Curl",
          "description": "Similar to bicep curl but with palms facing each other.",
          "focus": "Bicep and Forearm Strength"
        },
        "exercise_name": "Hammer Curl",
        "metadata": [
          {
            "type": "sets",
            "value": "3",
            "units": ""
          },
          {
            "type": "reps",
            "value": "12",
            "units": ""
          },
          {
            "type": "weight",
            "value": "5-10",
            "units": "kg"
          },
          {
            "type": "rpe",
            "value": "6",
            "units": ""
          },
          {
            "type": "rest",
            "value": "60",
            "units": ""
          },
          {
            "type": "notes",
            "value": "Engages both biceps and forearms.",
            "units": ""
          }
        ],
        "notes": "Enhances grip strength and overall arm development."
      },
      {
        "id": 5,
        "type": "exercise",
        "exercise": {
          "id": 4,
          "name": "Overhead Tricep Extension (Dumbbell)",
          "description": "Holding a dumbbell with both hands, extend overhead and lower behind the head.",
          "focus": "Tricep Growth"
        },
        "exercise_name": "Overhead Tricep Extension",
        "metadata": [
          {
            "type": "sets",
            "value": "3",
            "units": ""
          },
          {
            "type": "reps",
            "value": "10",
            "units": ""
          },
          {
            "type": "weight",
            "value": "5-10",
            "units": "kg"
          },
          {
            "type": "rpe",
            "value": "7",
            "units": ""
          },
          {
            "type": "rest",
            "value": "60",
            "units": ""
          },
          {
            "type": "notes",
            "value": "Maintain core engagement to support back.",
            "units": ""
          }
        ],
        "notes": "Focuses on long head of tricep for thickness."
      },
      {
        "id": 6,
        "type": "exercise",
        "exercise": {
          "id": 5,
          "name": "Concentration Curl",
          "description": "Sitting, curl one arm at a time while resting elbow on inner thigh.",
          "focus": "Bicep Isolation"
        },
        "exercise_name": "Concentration Curl",
        "metadata": [
          {
            "type": "sets",
            "value": "3",
            "units": ""
          },
          {
            "type": "reps",
            "value": "10-12",
            "units": ""
          },
          {
            "type": "weight",
            "value": "5-10",
            "units": "kg"
          },
          {
            "type": "rpe",
            "value": "6",
            "units": ""
          },
          {
            "type": "rest",
            "value": "60",
            "units": ""
          },
          {
            "type": "notes",
            "value": "Isolates biceps for maximum contraction.",
            "units": ""
          }
        ],
        "notes": "Ensures effective bicep engagement."
      },
      {
        "id": 7,
        "type": "exercise",
        "exercise": {
          "id": 6,
          "name": "Cooldown Stretching",
          "description": "Static stretching focusing on the arms and shoulders after workout.",
          "focus": "Recovery and Flexibility"
        },
        "exercise_name": "Cooldown Stretching",
        "metadata": [
          {
            "type": "notes",
            "value": "Hold each stretch for 20-30 seconds.",
            "units": ""
          },
          {
            "type": "reps",
            "value": "12",
            "units": ""
          },
          {
            "type": "weight",
            "value": "5-10",
            "units": "kg"
          },
          {
            "type": "rpe",
            "value": "6",
            "units": ""
          }
        ],
        "notes": "Incorporate stretches for the biceps, triceps, shoulders, and chest."
      }
    ],
    "notes": "This beginner-intermediate program focuses on arm hypertrophy and is structured for 3 days a week. Progress by gradually increasing weights or reps as strength improves."
  }
}
`
