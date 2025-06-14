// Simple test to verify circuit grid mapping
const workout = {
  id: "test-workout",
  program_order: 1,
  program_id: "test-program", 
  name: "Test Workout",
  blocks: [
    {
      type: "exercise",
      exercise: {
        id: "ex1",
        name: "Push-ups",
        metadata: {
          sets: "3",
          reps: "12",
          weight: "bodyweight",
          rest: "60s",
          notes: ""
        }
      }
    },
    {
      type: "circuit",
      circuit: {
        isDefault: false,
        name: "Circuit 1",
        description: "Circuit 1 description",
        metadata: {
          sets: "3",
          rest: "30s",
          notes: "Circuit 1 notes"
        },
        exercises: [
          {
            type: "exercise",
            exercise: {
              id: "ex2",
              name: "Squats",
              metadata: {
                sets: "3",
                reps: "15",
                weight: "bodyweight",
                rest: "0s",
                notes: ""
              }
            }
          },
          {
            type: "exercise", 
            exercise: {
              id: "ex3",
              name: "Lunges",
              metadata: {
                sets: "3",
                reps: "10",
                weight: "bodyweight", 
                rest: "0s",
                notes: ""
              }
            }
          }
        ]
      }
    },
    {
      type: "exercise",
      exercise: {
        id: "ex4",
        name: "Pull-ups",
        metadata: {
          sets: "3",
          reps: "8",
          weight: "bodyweight",
          rest: "90s",
          notes: ""
        }
      }
    }
  ]
};

const columns = [
  { field: "exercise_name", header: "Exercise", width: 200 },
  { field: "sets", header: "Sets", width: 80 },
  { field: "reps", header: "Reps", width: 80 },
  { field: "weight", header: "Weight", width: 100 },
  { field: "rest", header: "Rest", width: 80 },
  { field: "notes", header: "Notes", width: 150 }
];

// Expected grid structure:
// Row 0: Push-ups (exercise)
// Row 1: Circuit 1 (circuit header) 
// Row 2: Squats (exercise in circuit)
// Row 3: Lunges (exercise in circuit)
// Row 4: Pull-ups (exercise)

console.log("Test workout structure:");
console.log("- 1 standalone exercise (Push-ups)");
console.log("- 1 circuit with 2 exercises (Circuit 1: Squats, Lunges)"); 
console.log("- 1 standalone exercise (Pull-ups)");
console.log("\nExpected grid rows: 5 total");
console.log("Row 0: Push-ups");
console.log("Row 1: Circuit 1 (header)");
console.log("Row 2: Squats (in circuit)");
console.log("Row 3: Lunges (in circuit)");
console.log("Row 4: Pull-ups");

console.log("\nWorkout JSON structure:");
console.log(JSON.stringify(workout, null, 2)); 