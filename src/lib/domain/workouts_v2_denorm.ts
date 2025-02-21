// sampleProgramTemplate is the sample
// denormalized program that we work with in the program editor
const sampleProgramTemplate = {
  id: 'programID',
  name: 'Program Name',
  createdAt: '2021-01-01T00:00:00Z', // created_at
  updatedAt: '2021-01-01T00:00:00Z', // updated_at
  owner: {
    id: 'coachID',
    ownerType: 'coach', // or 'user', for non-coaches (owner_type)
    name: 'Coach Name',
  },
  // nullable container for assignee information
  assignee: {
    id: 'userID',
    name: 'User Name',
  },
  settings: {
    type: 'weekly',
    // how can i support
    weightUnits: 'lbs', // or 'kg' (weight_units)
    // TODO: how can i support 'RIR' and 'Percentage' in the same workout?
    // maybe this is the default and there can be overrides at the exercise level.
    effortUnits: 'RPE', // or 'RIR' | 'RPE' | 'Percentage' (requires maximum weight for the user) (effort_units)
  },
  // program type is 'weekly | splits'
  workouts: [
    {
      id: 'workoutID',
      name: 'Workout 1',
      // How do we represent circuits / supersets / warm up sets / cooldown sets?
      blocks: [
        {
          id: 'blockID',
          type: 'exercise', // or "circuit" or "text"
          exercise: {
            // we have a global list of exercises and also coaches can have their own exercises.
            id: 'exerciseID',
            isCustom: false, // if true, then the exercise is a custom exercise created by the coach (is_custom)
            name: 'Exercise Name',
            description: 'Exercise Description',
            metadata: {
              sets: '3', // or '2-3'
              reps: '10', // '10' (for all sets) or '10-12' or comma separated '10,12,15', '30s' for time-based, AMRAP, '12es' for each side
              weight: '135', // '35' (for all sets) or 'BW' for bodyweight or '35-45' or comma separated '35,45,55'
              rest: '60s', // or '1m', or '30-50s'. Units must be seconds or minutes
              intensity: '10', // '8-10', or '10,9,8', or '10-8,8-10'
              notes: 'Just some notes for the client',
            },
          },
        },
        {
          id: 'circuitBlockID',
          type: 'circuit',
          circuit: {
            id: 'circuitID',
            // if true, then this is a default circuit i.e. name is not modifiable.
            isDefault: false, // (is_default)
            name: 'Circuit Name', // default to 'Circuit' or 'Warm Up' or 'Cool Down'
            description: 'Circuit Description',
            metadata: {
              sets: '3', // or '2-3'
              rest: '60s', // or '1m', or '30-90s'. Units must be seconds or minutes
              notes: 'Just some notes for the client for this circuit',
            },
            exercises: [
              {
                // we have a global list of exercises and also coaches can have their own exercises.
                id: 'exerciseID',
                isCustom: false, // if true, then the exercise is a custom exercise created by the coach (is_custom)
                name: 'Exercise Name',
                description: 'Exercise Description',
                metadata: {
                  sets: '3', // or '2-3'
                  reps: '10', // '10' (for all sets) or '10-12' or comma separated '10,12,15', '30s' for time-based, AMRAP, '12es' for each side
                  weight: '135', // '35' (for all sets) or 'BW' for bodyweight or '35-45' or comma separated '35,45,55'
                  rest: '60s', // or '1m', or '30-50s'. Units must be seconds or minutes
                  intensity: '10', // '8-10', or '10,9,8', or '10-8,8-10'
                  notes: 'Just some notes for the client',
                },
              },
              {
                id: 'exerciseID',
                isCustom: true, // if true, then the exercise is a custom exercise created by the coach (is_custom)
                name: 'Exercise Name',
                description: 'Exercise Description',
                videoUrl: 'https://www.youtube.com/watch?v=12345', // (video_url)
                shortVideoUrl: 'https://www.youtube.com/watch?v=12345', // (short_video_url)
                metadata: {
                  sets: '3', // or '2-3'
                  reps: '10', // '10' (for all sets) or '10-12' or comma separated '10,12,15', '30s' for time-based, AMRAP, '12es' for each side
                  weight: '135', // '35' (for all sets) or 'BW' for bodyweight or '35-45' or comma separated '35,45,55'
                  rest: '60s', // or '1m', or '30-50s'. Units must be seconds or minutes
                  intensity: '10', // '8-10', or '10,9,8', or '10-8,8-10'
                  notes: 'Just some notes for the client',
                },
              },
              {
                id: 'blockID',
                type: 'text', // or "circuit" or "text"
                text: {
                  content: 'Just some text for the client',
                },
              },
            ],
          },
        },
      ],
    },
  ],
}
