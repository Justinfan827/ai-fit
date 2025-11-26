import { openai } from "@ai-sdk/openai"
import { generateObject, NoObjectGeneratedError, streamObject } from "ai"
import { stripIndent } from "common-tags"
import OpenAI from "openai"
import { describe, expect, it } from "vitest"
import { log } from "@/lib/logger/logger"
import {
  type EditWorkoutPlanActionWrapped,
  editOperationWrappedSchema,
} from "./schemas"

const openaiClient = new OpenAI()

const defaultModel = "gpt-4.1-nano"
const defaultModelLarger = "gpt-4.1-mini"
// const defaultModelLargest = "gpt-4.1"
const exampleEditPromptForInsertAfter = stripIndent`
You are an ai assistant that translates a free-form, natural-language edit requests into a
validated JSON array of edit operations. As inputs, you are given a description of the current workout program,
a list of supported exercises, and a text description of the requested changes to make. You will be given
the relevant schemas for the JSON response.

# General guidelines for the edit operations
- Every exercise referenced in the edit request MUST be matched to a real, provided exercise and reference its id.
Never invent exercises or ids. If the request names an unavailable exercise, select the closest
supported option by exact/synonym/sub-string match and use that exercise's canonical name and id from the list.
- When the request references a workout by position (e.g., "Day 2"), map via workout.program_order.
When it references by name, match case-insensitively to an existingworkout.name.
All operations MUST reference workouts by their UUID fields (anchorWorkoutId, workoutId, aWorkoutId, bWorkoutId).
- Allowed operations only: insertAfter, insertBefore, insertAtStart, insertAtEnd, swap, remove. DO NOT modify individual blocks inside existing workouts here.
- For newly inserted workouts, make sure the individual blocks adhere to the schemas. Use the exercises list to populate exercise ids
and canonical names. For exercise details, MAKE SURE to follow the training variables and notation as described below.

# Explaining an edit operation:

An edit operation type is determined by the operationToUse field. The valid values are:
- insertAfter
- insertBefore
- insertAtStart
- insertAtEnd
- swap
- remove

If the operationToUse is insertAfter, insertBefore, insertAtStart, or insertAtEnd, the corresponding field will be populated.
For example, if the operationToUse is insertAfter, the insertAfter field will be populated. If the operationToUse is swap,
the swap field will be populated. If the operationToUse is remove, the remove field will be populated:

## Examples of valid edit operations
{ "operationToUse": "swap", "swap": { "aWorkoutId": "<uuid>", "bWorkoutId": "<uuid>" } }
{ "operationToUse": "remove", "remove": { "workoutId": "<uuid>" } }
{ "operationToUse": "insertAtStart", "insertAtStart": { "workout": "<workout to insert>" } }
{ "operationToUse": "insertAtEnd", "insertAtEnd": { "workout": "<workout to insert>" } }
{ "operationToUse": "insertBefore", "insertBefore": { "anchorWorkoutId": "<uuid>", "workout": "<workout to insert>" } }
{ "operationToUse": "insertAfter", "insertAfter": { "anchorWorkoutId": "<uuid>", "workout": "<workout to insert>" } }

# Training variables and notation
- Reps and weights can be represented as:
- Comma separated values e.g. "12, 10, 8"
- Ranges e.g. "10-12"
- Range and comma values e.g. "10-12, 10-16, 8-10"
- The "Each Side" (ES or E/S) annotation is used to represent exercises that are performed on each side. e.g. 12ES, 12-15E/S
- Rest periods use the "s" suffix to represent seconds, "m" to represent minutes e.g. "30s", "1m", "2m30s"
- Weight can be represented as:
- Numeric values e.g. "135"
- Bodyweight (BW) e.g. "BW"
- Bodyweight plus a value e.g. "BW+10"
- Bodyweight plus a range e.g. "BW+10-20"
- Bodyweight plus a range and a comma separated values e.g. "BW+10-20"
- Weight units default to lbs, unless coach preferences specify otherwise.
- Exercise circuits are represented using the "A1,A2,A3...An" notation. E.g. a circuit with 3 exercises would be represented as
"A1:Exercise1,A2:Exercise2,A3:Exercise3".
- AMRAP is a special notation for exercises that are performed "As Many Reps As Possible".

# Example block schemas

## Exercise block example
{
"type": "exercise",
"exercise": {
"id": "<uuid from exercises list>",
"name": "<canonical name from exercises list>",
"metadata": {
"sets": "3",
"reps": "10,10-12,10-15",
"weight": "BW+10-20",
"rest": "1m30s",
"notes": "This is a note about the exercise"
}
}
}

## Circuit block example
{
"type": "circuit",
"circuit": {
"name": "Circuit 1",
"description": "This is a description of the circuit",
"metadata": { "sets": "3", "rest": "1m", "notes": "This is a note about the circuit" },
"exercises": [ <exercise blocks as above> ]
}
}

# Current workout program
Workout 1: Name: New Workout (id: 81956bbc-cf1d-4d98-a769-d89c1c957ce1)
- Double Leg Calf Raise w/Step (id: 37a20c73-39d7-486d-b6d7-7a35c88b5fa3)
Sets: 3
Reps: 12-15
Weight: BW
Rest: 1m
Notes:

- Single Leg Calf Raise w/Step (id: 109975fe-1901-4666-a1b7-1f837e9292d9)
Sets: 3
Reps: 10-12ES
Weight: BW
Rest: 1m
Notes:

- Circuit: Circuit 1
Sets: 3
Rest: 1m30s
Notes:
Exercises:
- (id: b03f7c37-8ec9-43d2-95fa-3cababbfe4f9) Calf Raises w/Knees Bent
Sets: 3
Reps: 12-15
Weight: BW
Rest: 30s
Notes:

- (id: c1d9ca3b-1921-470d-bd61-1a9b4ac9e55c) Heel Elevated Squats
Sets: 3
Reps: 10-12
Weight: BW
Rest: 30s
Notes:

- Circuit: Circuit 2
Sets: 3
Rest: 1m30s
Notes:
Exercises:
- (id: 33ec2d50-15dc-49a4-a203-d42792b79bd0) Reverse Lunges
Sets: 3
Reps: 10-12ES
Weight: BW
Rest: 30s
Notes:

- (id: 1f9d314b-0ede-4b5d-b1d8-f1a07d1e08eb) Split Squats
Sets: 3
Reps: 10-12ES
Weight: BW
Rest: 30s
Notes:

# Exercise list
- Double Leg Calf Raise w/Step (id: 37a20c73-39d7-486d-b6d7-7a35c88b5fa3)
- Single Leg Calf Raise w/Step (id: 109975fe-1901-4666-a1b7-1f837e9292d9)
- Calf Raises w/Knees Bent (id: b03f7c37-8ec9-43d2-95fa-3cababbfe4f9)
- Heel Elevated Squats (id: c1d9ca3b-1921-470d-bd61-1a9b4ac9e55c)
- Leg Extensions (id: 0b743f5c-7e77-42ec-8706-90c356b5a4e1)
- Walking Lunges (id: c68d68be-63a7-4e18-80dc-b587506bfb08)
- Reverse Lunges (id: 33ec2d50-15dc-49a4-a203-d42792b79bd0)
- Split Squats (id: 1f9d314b-0ede-4b5d-b1d8-f1a07d1e08eb)
- Single Leg Squats (id: 78f52cbe-5387-4aa7-b203-81cd551d397a)
- Hamstring Curls (id: 8b492eb3-9b21-453b-9e95-ad89e8fbc41b)
- RDLs (id: 4301b60b-0d31-4904-8b8a-081b33db4069)
- Walking Lunges (id: 9e043e02-1c29-4039-a45f-cbfb5d622f6a)
- Reverse Lunges (id: 02157acc-22b1-4c79-96fc-4d64edd0be73)
- Split Squats (id: c901e481-cfd9-42d6-af73-c53f5ae242f4)
- Hip Thrusts (id: 383a9170-1edf-49af-9134-fac82669af97)
- Crunches (id: 622c8978-090a-4699-a36b-cd29e66227a8)
- Reverse Crunches (id: 79dfa49e-5604-43af-bc0c-ca0697b06419)
- Hanging Knee/Leg Raises (id: b247bd98-1aa0-4990-bebb-0552a053f553)
- Leg Raises (id: 1c9615f7-535b-4766-8838-07e9c3c9074d)
- Crunch Pullthroughs (id: 35ccae47-c049-4d71-a7f7-a7f151124f82)
- Pull Ups (id: c39e1a21-2618-47bf-88b3-15bc5e94d3e7)
- Lat Pull Downs (id: 311dce1f-8ad1-4469-8410-875789ea9d1a)
- Cable Pullover (id: bb0dc6ee-fe63-4416-85ec-720ea6879f27)
- Dumbbell Pullover (id: 7a940739-132f-405c-93ef-43723b4d8fd6)
- Cable Row (id: aa70038a-6b68-4511-b31a-5ef89f30b1fb)
- TRX Row (id: 9f741413-d56b-4857-a101-e871d6818b4f)
- Dumbbell Rows (id: 4abe1cbf-c965-497b-a6eb-f8b032647a5e)
- Chest Supported DB Rows (id: fb3e6501-1950-4d8a-8e55-1da21c2f6683)
- Face Pulls (id: aed3efb0-0188-45d9-93f1-5aaeeddc9a30)
- Rear Delt Flys (id: b7c051ab-ba49-4461-baf5-a9f5a1275f73)
- Shrugs (id: 651bdbd9-9f05-4aef-875d-1f5b3b254ce2)
- Bench Press (id: 723ba1af-7151-4db1-9a8a-9627bdc5e3b6)
- Dumbbell Press (id: ba9e52ba-10fe-45ba-bc21-e34bcaa37865)
- Smith Bench Press (id: 3e11680b-1e86-4a95-bc2b-e10b04615b5c)
- Incline Smith Bench (id: 92c57f27-78d6-4ce7-94b6-55b5828b0c66)
- Incline Dumbbell Press (id: cfb8f4ef-bd5a-4a64-9302-7e029689ebf0)
- Pushups (id: 8f18f04d-ce77-434f-a486-91db8139e180)
- Pushups w/Bar (id: 72699b26-b37c-4004-a3b0-c4b335c86c6b)
- TRX Pushup (id: 9a70d80a-7201-4945-a9c0-2886d865a989)
- Cable Fly/Press (id: fb48b8fe-9eb6-426f-81e0-2762c3bef12b)
- Incline Cable Fly/Press (id: 6a01c709-94fe-41a3-bbf3-84f34437c18a)
- Dips (id: 892ee357-e2d9-40a3-a9e9-5f73909062e9)
- Overhead Press (id: a204f27a-fd38-48ec-a99b-f9344cadbd12)
- Dumbbell Lateral Raise (id: 15bd400b-dbce-4e7a-956d-463e17a5c1e4)
- Cable Lateral Raise (id: 4142bc6d-a96b-4a8c-97bb-45e95e283f77)
- Front Raise (id: 045611f6-699f-4a5a-b426-dc8971021f88)
- Face Pulls (id: 7fa9823b-6177-4ea7-b375-698e17a382bf)
- Barbell Curl (id: ee4edee4-113b-4f69-8cef-915a2bc89f51)
- Dumbbell Curl (id: c19a2b68-5705-4b8e-a6cb-f09261c7d0b6)
- Cable Curl (id: c3ef1cef-7567-47b1-b00b-98d513301b59)
- Cable Full ROM Curl (id: d3f9cf29-7029-464d-bebe-05737cf69126)
- Hammer Curl (id: a41a227a-9c12-49ec-bf46-c0a5a08287f9)
- Rev Grip Curl (id: 3cba23f8-fb35-4601-b2f7-4912763b34b5)
- Cable Tricep Extension (id: 961ff670-b39c-4462-b369-1726b9a86d54)
- Cross Body Tricep Extension (id: b27f15e0-58cd-4697-a973-d8bb860abf7d)
- Skull Crushers (id: ef2182d1-077b-4747-8495-b79896c80f4d)
- Close Grip Bench (id: 6cf92245-78fb-4ec6-b8b4-8202cfacff12)
- Dips (id: 13f62034-9008-4526-9ce9-36c56c9ca647)
- Double Leg Calf Raise w/Ground (id: 837e9df5-833d-43c3-bae8-c76d02d2e445)
- Squats (id: 9b6de57e-3aa2-4548-8209-d44eea4db1c4)
- Box Step Ups (id: 960fbc21-e182-4bd9-b243-1328f7a06c4b)
- Weighted Jumps (id: 4dbf4d89-b1a9-4d1a-a9c0-cdfa48f88720)
- Nordic Ham Curls (id: f5a3237b-8ec5-4a14-94e0-9e9d006c2b38)
- RDLs (id: 63476f83-cc7b-4214-b0b1-22862afb3760)
- Deadlifts (id: 107ee569-90b1-47f4-83c7-b12b953fca76)
- Squats (id: bae7dc88-1f25-4d26-bab4-636f1eb7ea14)
- Deadlifts (id: ad1001f4-0189-478d-8d31-d5144e7e2e4e)
- Box Step Ups (id: 50279680-e4ce-47ee-9cfa-3ca81ec68bd2)
- Lower Back Flexion (id: e7337b10-b263-4235-b523-7aae09ae7115)
- Deadlifts (id: d0577319-7628-4aaf-846a-61809e6c1e28)
- Pull Ups (id: a47d0809-ce0c-4452-bd30-936433da1864)
- Barbell Rows (id: cb31eceb-05ef-4272-be59-4c6556aed89d)
- Dumbbell Rows (id: 73f147e2-5a29-43b8-a9c8-5a58dead43ac)
- Bench Press (id: d9013b32-11a5-4427-9097-5294d959dc94)
- Dumbbell Press (id: 85c58b83-c672-49c8-80f1-bf370d761ca4)
- Pushups (id: b2431b21-ebe2-4eda-a30c-ced901908c89)
- Dumbbell Overhead Press (id: f539d4c0-08ef-44f1-9a7e-dbcbb7c1c6f6)
- Barbell Overhead Press (id: 752c4a98-c61a-466d-a97e-0131d65472df)
- Single Leg Balance w/Foam (id: 1b10d771-7235-4b8b-bfdb-674a09bb1a55)
- Y Balance (id: 954280b1-692f-4729-b10e-4406cac3facb)
- 2 Tool Rotation (id: 6ef0fcea-cc59-48f2-b2a9-77ea0a1936e8)
- Lateral Step Downs (id: 57769551-2589-4a0a-b1aa-f3f60e6bd27e)
- Single Leg Squats (id: 3e8c19d7-7390-4aaa-b1b9-8e5113623545)
- Spanish Squats (id: adfffa08-7c58-416b-8a9b-b3e864ce44dc)
- Single Leg RDLs (id: 871ca6e5-c39e-4bdf-a1e9-c446be844c90)
- Single Leg Bridge (id: 5d834d06-a077-41e4-85c0-d5ab47ba033e)
- Birddog (id: 7f2c350f-beea-46b4-b705-c5549b38ab7c)
- Birddog Row (id: f01cd06c-b40b-4ed7-b125-9a6ce2c30ce2)
- Plank w/Lift (id: e2617cfe-4b63-43ea-a562-a593f2244913)
- Plank w/Knees Touch Elbows (id: 3dd3722c-2730-4257-8ce0-26dcc879f819)
- Side Plank w/Lift (id: 09f82801-0878-4c9c-ba0c-8cff4b8a3ea5)
- Side Plank w/Cable Row (id: 8d2f73f3-5ff7-46f2-bc02-3d4b0dab01c7)
- Side Plank w/Hip Dip (id: 90ec2cda-cc63-494a-ab34-2d0d6e5c1065)
- Plank w/Yoga Ball (id: 21c28fb5-0d84-4227-95f5-52cc7b9eff28)
- Copenhagen Plank (id: b6fd6d41-dab6-413f-9867-31d6108c2bb6)
- Pallof Press (id: d220b341-0ae6-4719-908a-8533385802de)
- Anti-Rotation Walkouts (id: 7c969723-9eda-4a7b-bd12-b1aceb1d746f)
- Suitcase Carry (id: 88c66aad-8efa-4448-a177-5746ed5fe38e)
- Chaotic Suitcase Carry (id: 397a218e-8302-4644-a14f-d57dde6512fc)
- SL RDL (id: f0ae06d6-efa0-4ae9-8f52-83d6e195c043)
- Marching w/Foam Roller (id: 6c27e904-f841-4eb1-bd32-1818f65f345f)
- Side Plank (id: 7be64b96-9c8d-4f3e-a47c-274d6e2e8083)
- High Er Y (id: 2d810a90-faa6-4c9c-9ad9-25db770fa1e6)
- Rev Kettlebell Carry (id: 4458f5ef-09b5-45fb-b4ca-201e2112f828)
- Banded Dorsiflexion (id: 8a03c471-538e-4cac-b670-2530594c6c8e)
- Weighted Dorsiflexion (id: 3720f406-42fd-4c7b-a416-9a2e501a2266)
- Child Pose w/Plantarflexion (id: 3411bd64-b7b7-4dd6-a323-a74b6b37336f)
- Toe Extensions (id: a01c584f-f0b2-480c-b13c-291e8c1341b6)
- Gastroc Stretch (id: 0b2e8a8f-8293-4860-b1fa-c438b345a93c)
- Soleus Stretch (id: 083ac146-10ed-4641-b965-46346aefe362)
- ATG Split Squat (id: 1c5a5dfe-5a45-4465-ade0-dcff9dfa096e)
- Prone Quad Stretch w/Strap (id: 53bedb7a-e938-452b-a67b-a68ef93bbb9b)
- Quad Sets (id: e2247da9-464a-4381-85e4-ce8563ba42e3)
- Heel Slides (id: 9e42d8ad-bbe8-45e6-ae35-4c4c579f3366)
- ATG Split Squat (id: ba20d3ca-95f8-4555-9dbe-4a71434c133e)
- Hamstring Stretch w/Rotations (id: 39750879-ec16-4762-b189-935b5cf476c4)
- Seated Hamstring Stretch (id: cb0958d3-4b65-4949-ba46-ed5d419f1b38)
- Falling 4's (id: 7a16bd72-e030-42f7-952a-df44203d0faf)
- Piriformis Stretch (id: f6cf29d4-2cc0-44d0-8fb3-ffb8d08d3c33)
- Falling 4/Piriformis Combo (id: be698c1e-ee0e-4f84-930c-c6413364287f)
- Lunge Stretch (id: b1e45a00-1db8-45f3-857f-82c0fc1a37f4)
- Couch Stretch (id: a68529b1-cc06-4b73-8115-369294a11149)
- Half Frog Stretch (id: 4f16ed87-162f-4b17-bb6d-c4437ac67354)
- Hip Airplane (id: 76704c44-3da4-463c-88a8-988afb627a8a)
- Banded Hip Mobilization (id: 4eaf0719-6ebc-429f-ad17-1415096061de)
- 3-Way Child Pose (id: 782af14f-a647-42e8-a818-c62fae517d14)
- QL Stretch (id: 6afdb424-0296-4676-86fc-299df59a4086)
- Open Books (id: 36d30a9c-162b-4bdc-aeb5-43b936732d0e)
- Thread Needle (id: 05bd3ffb-bd13-4eeb-8ee4-c00bec81557e)
- Doorway Pec Stretch (id: 9f669e47-689f-4c9e-9fdd-a650d284c4aa)
- Bar Hangs (id: ac98c146-36ff-4923-8875-0cc1546c3452)
- Uppercuts w/Fr (id: bb050925-f91e-4895-8604-3d40ba08e549)
- Cross Body Stretch (id: 9bdde578-0db3-4397-b02a-fac13b4c7b49)
- Sleeper Stretch (id: 0153c2d3-7c72-40b2-8d45-823a23b908b1)
- Lift Offs (id: eebdc6bb-4c86-46e1-a50f-119dcd1095c1)
- Behind Back Towel Pulls (id: 0f97276b-829e-48d1-9eb7-68b88f2bbac1)
- Reverse Sweeps (Peroneal Strength) (id: 40373bdb-e6ee-4e94-a6d9-8bad74d8f8bb)
- Sweeps (Posterior Tibialis Strength) (id: 82de3062-df40-450f-9bad-03c1b41b7b32)
- Toe Raises (Anterior Tibialis Strength) (id: 797c2ce6-c5bc-41cc-a136-eab43ffa3653)
- Terminal Knee Extension (id: 4342c5b3-b007-4586-b367-09e5f3b817ec)
- Quad Sets (id: eee9ccee-9703-4134-a790-899c69476682)
- Hamstring Towel Curls (id: 8d7908d0-88ac-4232-b2a5-714ccfae5284)
- Heel Slides (id: 9c4cb309-5a85-42f5-80fd-1648797750bd)
- Ball Squeeze (id: 157b98b8-bbc1-45ad-a0fa-3a3a4511260a)
- Copehagen Plank (id: 8b05ae16-9c0c-4fa3-804f-6aafe3e473ee)
- Supine Hip Flexion (id: b2bbb7f4-e3fc-4118-8953-f0efd1aeb21b)
- Side Lying Leg Raises (id: bf239483-1392-4f48-abe2-85457ca05d67)
- Cable Hip Abduction (id: 62b7d6d3-7a3f-4ea9-8695-d89dfe603b0f)
- ITY's (id: 3d9f1923-5260-40da-87c8-5d00a22f5167)
- Pushup Plus (id: 6799dd4d-a172-419e-b739-fa57e320eb1b)
- Full ROM Row (id: 866b146c-f9dd-4373-a90e-f642fd2f825c)
- High ER Y (id: d93a5f34-da87-4f0b-a314-ad84e7848fb9)
- No Moneys (id: 6c62c239-4c28-4d97-b225-b9448519af01)
- ER @ Neutral (id: 11db5143-b347-4282-9435-2d1ae707410d)
- IR @ Neutral (id: 723ce6c3-4366-4251-98eb-11a3dfcd634f)
- ER @ 90 (id: 1ccac44e-7101-455e-9cff-42ac031f6add)
- IR @ 90 (id: f361b5d3-c2d7-48fd-88e0-b48c27d0befc)
- Snow Angles (id: 068d8fb7-d8e5-42ca-8892-714b3f1b9b7d)
- Abduction Upper Cuts w/FR (id: 70f25850-1df9-4642-b1b0-e76335f0e105)
- Lock 3 (id: 144477c3-880d-4179-9d4c-9ba6de0238f2)

`
const exampleEditPrompt = stripIndent`
You are an ai assistant that translates a free-form, natural-language edit requests into a
validated JSON array of edit operations. As inputs, you are given a description of the current workout program,
a list of supported exercises, and a text description of the requested changes to make. You will be given
the relevant schemas for the JSON response.

# General guidelines for the edit operations
- Every exercise referenced in the edit request MUST be matched to a real, provided exercise and reference its id.
Never invent exercises or ids. If the request names an unavailable exercise, select the closest
supported option by exact/synonym/sub-string match and use that exercise's canonical name and id from the list.
- When the request references a workout by position (e.g., "Day 2"), map via workout.program_order.
When it references by name, match case-insensitively to an existingworkout.name.
All operations MUST reference workouts by their UUID fields (anchorWorkoutId, workoutId, aWorkoutId, bWorkoutId).
- Allowed operations only: insertAfter, insertBefore, insertAtStart, insertAtEnd, swap, remove. DO NOT modify individual blocks inside existing workouts here.
- For newly inserted workouts, make sure the individual blocks adhere to the schemas. Use the exercises list to populate exercise ids
and canonical names. For exercise details, MAKE SURE to follow the training variables and notation as described below.

# Explaining an edit operation:

An edit operation type is determined by the operationToUse field. The valid values are:
- insertAfter
- insertBefore
- insertAtStart
- insertAtEnd
- swap
- remove

If the operationToUse is insertAfter, insertBefore, insertAtStart, or insertAtEnd, the corresponding field will be populated.
For example, if the operationToUse is insertAfter, the insertAfter field will be populated. If the operationToUse is swap,
the swap field will be populated. If the operationToUse is remove, the remove field will be populated:

## Examples of valid edit operations
{
"operationToUse": "insertAfter",
"insertAfter": {
"workoutIndex": 0,
"workoutId": "123"
}
}

{
"operationToUse": "swap",
"swap": {
"workoutIndex": 0,
"workoutId": "123"
}
}

{
"operationToUse": "remove",
"remove": {
  "workoutId": "123"
}
}

# Training variables and notation
- Reps and weights can be represented as:
- Comma separated values e.g. "12, 10, 8"
- Ranges e.g. "10-12"
- Range and comma values e.g. "10-12, 10-16, 8-10"
- The "Each Side" (ES or E/S) annotation is used to represent exercises that are performed on each side. e.g. 12ES, 12-15E/S
- Rest periods use the "s" suffix to represent seconds, "m" to represent minutes e.g. "30s", "1m", "2m30s"
- Weight can be represented as:
- Numeric values e.g. "135"
- Bodyweight (BW) e.g. "BW"
- Bodyweight plus a value e.g. "BW+10"
- Bodyweight plus a range e.g. "BW+10-20"
- Bodyweight plus a range and a comma separated values e.g. "BW+10-20"
- Weight units default to lbs, unless coach preferences specify otherwise.
- Exercise circuits are represented using the "A1,A2,A3...An" notation. E.g. a circuit with 3 exercises would be represented as
"A1:Exercise1,A2:Exercise2,A3:Exercise3".
- AMRAP is a special notation for exercises that are performed "As Many Reps As Possible".

# Example block schemas

## Exercise block example
{
"type": "exercise",
"exercise": {
"id": "<uuid from exercises list>",
"name": "<canonical name from exercises list>",
"metadata": {
"sets": "3",
"reps": "10,10-12,10-15",
"weight": "BW+10-20",
"rest": "1m30s",
"notes": "This is a note about the exercise"
}
}
}

## Circuit block example
{
"type": "circuit",
"circuit": {
"name": "Circuit 1",
"description": "This is a description of the circuit",
"metadata": { "sets": "3", "rest": "1m", "notes": "This is a note about the circuit" },
"exercises": [ <exercise blocks as above> ]
}
}

# Current workout program
Workout 1: Name: workout 1 (id: 6b4cf510-e0a9-4634-ad5e-c082bb66ef61)
- Double Leg Calf Raise w/Step (id: 37a20c73-39d7-486d-b6d7-7a35c88b5fa3)
Sets: 3
Reps: 12
Weight: 100
Rest: 30s

- Single Leg Calf Raise w/Step (id: 109975fe-1901-4666-a1b7-1f837e9292d9)
Sets: 3
Reps: 12
Weight: 100
Rest: 30s

- Circuit: Circuit 1
Sets: 3
Rest: 30s
Exercises:
- (id: b03f7c37-8ec9-43d2-95fa-3cababbfe4f9) Calf Raises w/Knees Bent
Sets: 3
Reps: 12
Weight: 100
Rest: 30s

- (id: c1d9ca3b-1921-470d-bd61-1a9b4ac9e55c) Heel Elevated Squats
Sets: 3
Reps: 12
Weight: 100
Rest: 30s

- Circuit: Circuit 2
Sets: 3
Rest: 30s
Exercises:
- (id: 33ec2d50-15dc-49a4-a203-d42792b79bd0) Reverse Lunges
Sets: 3
Reps: 12
Weight: 100
Rest: 30s

- (id: 1f9d314b-0ede-4b5d-b1d8-f1a07d1e08eb) Split Squats
Sets: 3
Reps: 12
Weight: 100
Rest: 30s


# Exercise list
- Double Leg Calf Raise w/Step (id: 37a20c73-39d7-486d-b6d7-7a35c88b5fa3)
- Single Leg Calf Raise w/Step (id: 109975fe-1901-4666-a1b7-1f837e9292d9)
- Calf Raises w/Knees Bent (id: b03f7c37-8ec9-43d2-95fa-3cababbfe4f9)
- Heel Elevated Squats (id: c1d9ca3b-1921-470d-bd61-1a9b4ac9e55c)
- Leg Extensions (id: 0b743f5c-7e77-42ec-8706-90c356b5a4e1)
- Walking Lunges (id: c68d68be-63a7-4e18-80dc-b587506bfb08)
- Reverse Lunges (id: 33ec2d50-15dc-49a4-a203-d42792b79bd0)
- Split Squats (id: 1f9d314b-0ede-4b5d-b1d8-f1a07d1e08eb)
- Single Leg Squats (id: 78f52cbe-5387-4aa7-b203-81cd551d397a)
- Hamstring Curls (id: 8b492eb3-9b21-453b-9e95-ad89e8fbc41b)
- RDLs (id: 4301b60b-0d31-4904-8b8a-081b33db4069)
- Walking Lunges (id: 9e043e02-1c29-4039-a45f-cbfb5d622f6a)
- Reverse Lunges (id: 02157acc-22b1-4c79-96fc-4d64edd0be73)
- Split Squats (id: c901e481-cfd9-42d6-af73-c53f5ae242f4)
- Hip Thrusts (id: 383a9170-1edf-49af-9134-fac82669af97)
- Crunches (id: 622c8978-090a-4699-a36b-cd29e66227a8)
- Reverse Crunches (id: 79dfa49e-5604-43af-bc0c-ca0697b06419)
- Hanging Knee/Leg Raises (id: b247bd98-1aa0-4990-bebb-0552a053f553)
- Leg Raises (id: 1c9615f7-535b-4766-8838-07e9c3c9074d)
- Crunch Pullthroughs (id: 35ccae47-c049-4d71-a7f7-a7f151124f82)
- Pull Ups (id: c39e1a21-2618-47bf-88b3-15bc5e94d3e7)
- Lat Pull Downs (id: 311dce1f-8ad1-4469-8410-875789ea9d1a)
- Cable Pullover (id: bb0dc6ee-fe63-4416-85ec-720ea6879f27)
- Dumbbell Pullover (id: 7a940739-132f-405c-93ef-43723b4d8fd6)
- Cable Row (id: aa70038a-6b68-4511-b31a-5ef89f30b1fb)
- TRX Row (id: 9f741413-d56b-4857-a101-e871d6818b4f)
- Dumbbell Rows (id: 4abe1cbf-c965-497b-a6eb-f8b032647a5e)
- Chest Supported DB Rows (id: fb3e6501-1950-4d8a-8e55-1da21c2f6683)
- Face Pulls (id: aed3efb0-0188-45d9-93f1-5aaeeddc9a30)
- Rear Delt Flys (id: b7c051ab-ba49-4461-baf5-a9f5a1275f73)
- Shrugs (id: 651bdbd9-9f05-4aef-875d-1f5b3b254ce2)
- Bench Press (id: 723ba1af-7151-4db1-9a8a-9627bdc5e3b6)
- Dumbbell Press (id: ba9e52ba-10fe-45ba-bc21-e34bcaa37865)
- Smith Bench Press (id: 3e11680b-1e86-4a95-bc2b-e10b04615b5c)
- Incline Smith Bench (id: 92c57f27-78d6-4ce7-94b6-55b5828b0c66)
- Incline Dumbbell Press (id: cfb8f4ef-bd5a-4a64-9302-7e029689ebf0)
- Pushups (id: 8f18f04d-ce77-434f-a486-91db8139e180)
- Pushups w/Bar (id: 72699b26-b37c-4004-a3b0-c4b335c86c6b)
- TRX Pushup (id: 9a70d80a-7201-4945-a9c0-2886d865a989)
- Cable Fly/Press (id: fb48b8fe-9eb6-426f-81e0-2762c3bef12b)
- Incline Cable Fly/Press (id: 6a01c709-94fe-41a3-bbf3-84f34437c18a)
- Dips (id: 892ee357-e2d9-40a3-a9e9-5f73909062e9)
- Overhead Press (id: a204f27a-fd38-48ec-a99b-f9344cadbd12)
- Dumbbell Lateral Raise (id: 15bd400b-dbce-4e7a-956d-463e17a5c1e4)
- Cable Lateral Raise (id: 4142bc6d-a96b-4a8c-97bb-45e95e283f77)
- Front Raise (id: 045611f6-699f-4a5a-b426-dc8971021f88)
- Face Pulls (id: 7fa9823b-6177-4ea7-b375-698e17a382bf)
- Barbell Curl (id: ee4edee4-113b-4f69-8cef-915a2bc89f51)
- Dumbbell Curl (id: c19a2b68-5705-4b8e-a6cb-f09261c7d0b6)
- Cable Curl (id: c3ef1cef-7567-47b1-b00b-98d513301b59)
- Cable Full ROM Curl (id: d3f9cf29-7029-464d-bebe-05737cf69126)
- Hammer Curl (id: a41a227a-9c12-49ec-bf46-c0a5a08287f9)
- Rev Grip Curl (id: 3cba23f8-fb35-4601-b2f7-4912763b34b5)
- Cable Tricep Extension (id: 961ff670-b39c-4462-b369-1726b9a86d54)
- Cross Body Tricep Extension (id: b27f15e0-58cd-4697-a973-d8bb860abf7d)
- Skull Crushers (id: ef2182d1-077b-4747-8495-b79896c80f4d)
- Close Grip Bench (id: 6cf92245-78fb-4ec6-b8b4-8202cfacff12)
- Dips (id: 13f62034-9008-4526-9ce9-36c56c9ca647)
- Double Leg Calf Raise w/Ground (id: 837e9df5-833d-43c3-bae8-c76d02d2e445)
- Squats (id: 9b6de57e-3aa2-4548-8209-d44eea4db1c4)
- Box Step Ups (id: 960fbc21-e182-4bd9-b243-1328f7a06c4b)
- Weighted Jumps (id: 4dbf4d89-b1a9-4d1a-a9c0-cdfa48f88720)
- Nordic Ham Curls (id: f5a3237b-8ec5-4a14-94e0-9e9d006c2b38)
- RDLs (id: 63476f83-cc7b-4214-b0b1-22862afb3760)
- Deadlifts (id: 107ee569-90b1-47f4-83c7-b12b953fca76)
- Squats (id: bae7dc88-1f25-4d26-bab4-636f1eb7ea14)
- Deadlifts (id: ad1001f4-0189-478d-8d31-d5144e7e2e4e)
- Box Step Ups (id: 50279680-e4ce-47ee-9cfa-3ca81ec68bd2)
- Lower Back Flexion (id: e7337b10-b263-4235-b523-7aae09ae7115)
- Deadlifts (id: d0577319-7628-4aaf-846a-61809e6c1e28)
- Pull Ups (id: a47d0809-ce0c-4452-bd30-936433da1864)
- Barbell Rows (id: cb31eceb-05ef-4272-be59-4c6556aed89d)
- Dumbbell Rows (id: 73f147e2-5a29-43b8-a9c8-5a58dead43ac)
- Bench Press (id: d9013b32-11a5-4427-9097-5294d959dc94)
- Dumbbell Press (id: 85c58b83-c672-49c8-80f1-bf370d761ca4)
- Pushups (id: b2431b21-ebe2-4eda-a30c-ced901908c89)
- Dumbbell Overhead Press (id: f539d4c0-08ef-44f1-9a7e-dbcbb7c1c6f6)
- Barbell Overhead Press (id: 752c4a98-c61a-466d-a97e-0131d65472df)
- Single Leg Balance w/Foam (id: 1b10d771-7235-4b8b-bfdb-674a09bb1a55)
- Y Balance (id: 954280b1-692f-4729-b10e-4406cac3facb)
- 2 Tool Rotation (id: 6ef0fcea-cc59-48f2-b2a9-77ea0a1936e8)
- Lateral Step Downs (id: 57769551-2589-4a0a-b1aa-f3f60e6bd27e)
- Single Leg Squats (id: 3e8c19d7-7390-4aaa-b1b9-8e5113623545)
- Spanish Squats (id: adfffa08-7c58-416b-8a9b-b3e864ce44dc)
- Single Leg RDLs (id: 871ca6e5-c39e-4bdf-a1e9-c446be844c90)
- Single Leg Bridge (id: 5d834d06-a077-41e4-85c0-d5ab47ba033e)
- Birddog (id: 7f2c350f-beea-46b4-b705-c5549b38ab7c)
- Birddog Row (id: f01cd06c-b40b-4ed7-b125-9a6ce2c30ce2)
- Plank w/Lift (id: e2617cfe-4b63-43ea-a562-a593f2244913)
- Plank w/Knees Touch Elbows (id: 3dd3722c-2730-4257-8ce0-26dcc879f819)
- Side Plank w/Lift (id: 09f82801-0878-4c9c-ba0c-8cff4b8a3ea5)
- Side Plank w/Cable Row (id: 8d2f73f3-5ff7-46f2-bc02-3d4b0dab01c7)
- Side Plank w/Hip Dip (id: 90ec2cda-cc63-494a-ab34-2d0d6e5c1065)
- Plank w/Yoga Ball (id: 21c28fb5-0d84-4227-95f5-52cc7b9eff28)
- Copenhagen Plank (id: b6fd6d41-dab6-413f-9867-31d6108c2bb6)
- Pallof Press (id: d220b341-0ae6-4719-908a-8533385802de)
- Anti-Rotation Walkouts (id: 7c969723-9eda-4a7b-bd12-b1aceb1d746f)
- Suitcase Carry (id: 88c66aad-8efa-4448-a177-5746ed5fe38e)
- Chaotic Suitcase Carry (id: 397a218e-8302-4644-a14f-d57dde6512fc)
- SL RDL (id: f0ae06d6-efa0-4ae9-8f52-83d6e195c043)
- Marching w/Foam Roller (id: 6c27e904-f841-4eb1-bd32-1818f65f345f)
- Side Plank (id: 7be64b96-9c8d-4f3e-a47c-274d6e2e8083)
- High Er Y (id: 2d810a90-faa6-4c9c-9ad9-25db770fa1e6)
- Rev Kettlebell Carry (id: 4458f5ef-09b5-45fb-b4ca-201e2112f828)
- Banded Dorsiflexion (id: 8a03c471-538e-4cac-b670-2530594c6c8e)
- Weighted Dorsiflexion (id: 3720f406-42fd-4c7b-a416-9a2e501a2266)
- Child Pose w/Plantarflexion (id: 3411bd64-b7b7-4dd6-a323-a74b6b37336f)
- Toe Extensions (id: a01c584f-f0b2-480c-b13c-291e8c1341b6)
- Gastroc Stretch (id: 0b2e8a8f-8293-4860-b1fa-c438b345a93c)
- Soleus Stretch (id: 083ac146-10ed-4641-b965-46346aefe362)
- ATG Split Squat (id: 1c5a5dfe-5a45-4465-ade0-dcff9dfa096e)
- Prone Quad Stretch w/Strap (id: 53bedb7a-e938-452b-a67b-a68ef93bbb9b)
- Quad Sets (id: e2247da9-464a-4381-85e4-ce8563ba42e3)
- Heel Slides (id: 9e42d8ad-bbe8-45e6-ae35-4c4c579f3366)
- ATG Split Squat (id: ba20d3ca-95f8-4555-9dbe-4a71434c133e)
- Hamstring Stretch w/Rotations (id: 39750879-ec16-4762-b189-935b5cf476c4)
- Seated Hamstring Stretch (id: cb0958d3-4b65-4949-ba46-ed5d419f1b38)
- Falling 4's (id: 7a16bd72-e030-42f7-952a-df44203d0faf)
- Piriformis Stretch (id: f6cf29d4-2cc0-44d0-8fb3-ffb8d08d3c33)
- Falling 4/Piriformis Combo (id: be698c1e-ee0e-4f84-930c-c6413364287f)
- Lunge Stretch (id: b1e45a00-1db8-45f3-857f-82c0fc1a37f4)
- Couch Stretch (id: a68529b1-cc06-4b73-8115-369294a11149)
- Half Frog Stretch (id: 4f16ed87-162f-4b17-bb6d-c4437ac67354)
- Hip Airplane (id: 76704c44-3da4-463c-88a8-988afb627a8a)
- Banded Hip Mobilization (id: 4eaf0719-6ebc-429f-ad17-1415096061de)
- 3-Way Child Pose (id: 782af14f-a647-42e8-a818-c62fae517d14)
- QL Stretch (id: 6afdb424-0296-4676-86fc-299df59a4086)
- Open Books (id: 36d30a9c-162b-4bdc-aeb5-43b936732d0e)
- Thread Needle (id: 05bd3ffb-bd13-4eeb-8ee4-c00bec81557e)
- Doorway Pec Stretch (id: 9f669e47-689f-4c9e-9fdd-a650d284c4aa)
- Bar Hangs (id: ac98c146-36ff-4923-8875-0cc1546c3452)
- Uppercuts w/Fr (id: bb050925-f91e-4895-8604-3d40ba08e549)
- Cross Body Stretch (id: 9bdde578-0db3-4397-b02a-fac13b4c7b49)
- Sleeper Stretch (id: 0153c2d3-7c72-40b2-8d45-823a23b908b1)
- Lift Offs (id: eebdc6bb-4c86-46e1-a50f-119dcd1095c1)
- Behind Back Towel Pulls (id: 0f97276b-829e-48d1-9eb7-68b88f2bbac1)
- Reverse Sweeps (Peroneal Strength) (id: 40373bdb-e6ee-4e94-a6d9-8bad74d8f8bb)
- Sweeps (Posterior Tibialis Strength) (id: 82de3062-df40-450f-9bad-03c1b41b7b32)
- Toe Raises (Anterior Tibialis Strength) (id: 797c2ce6-c5bc-41cc-a136-eab43ffa3653)
- Terminal Knee Extension (id: 4342c5b3-b007-4586-b367-09e5f3b817ec)
- Quad Sets (id: eee9ccee-9703-4134-a790-899c69476682)
- Hamstring Towel Curls (id: 8d7908d0-88ac-4232-b2a5-714ccfae5284)
- Heel Slides (id: 9c4cb309-5a85-42f5-80fd-1648797750bd)
- Ball Squeeze (id: 157b98b8-bbc1-45ad-a0fa-3a3a4511260a)
- Copehagen Plank (id: 8b05ae16-9c0c-4fa3-804f-6aafe3e473ee)
- Supine Hip Flexion (id: b2bbb7f4-e3fc-4118-8953-f0efd1aeb21b)
- Side Lying Leg Raises (id: bf239483-1392-4f48-abe2-85457ca05d67)
- Cable Hip Abduction (id: 62b7d6d3-7a3f-4ea9-8695-d89dfe603b0f)
- ITY's (id: 3d9f1923-5260-40da-87c8-5d00a22f5167)
- Pushup Plus (id: 6799dd4d-a172-419e-b739-fa57e320eb1b)
- Full ROM Row (id: 866b146c-f9dd-4373-a90e-f642fd2f825c)
- High ER Y (id: d93a5f34-da87-4f0b-a314-ad84e7848fb9)
- No Moneys (id: 6c62c239-4c28-4d97-b225-b9448519af01)
- ER @ Neutral (id: 11db5143-b347-4282-9435-2d1ae707410d)
- IR @ Neutral (id: 723ce6c3-4366-4251-98eb-11a3dfcd634f)
- ER @ 90 (id: 1ccac44e-7101-455e-9cff-42ac031f6add)
- IR @ 90 (id: f361b5d3-c2d7-48fd-88e0-b48c27d0befc)
- Snow Angles (id: 068d8fb7-d8e5-42ca-8892-714b3f1b9b7d)
- Abduction Upper Cuts w/FR (id: 70f25850-1df9-4642-b1b0-e76335f0e105)
- Lock 3 (id: 144477c3-880d-4179-9d4c-9ba6de0238f2)

`
describe("Structured output", () => {
  // NOTE: skipping test because schemas don't work with openai at the moment (optional vs. nullable stuff)
  // it.skip("openai sdk supports remove operation", async () => {
  //   const zodFormat = zodTextFormat(editOperationWrappedSchema, "editOperation")
  //   const response = await openaiClient.responses.parse({
  //     model: defaultModel,
  //     input: [
  //       {
  //         role: "system",
  //         content: exampleEditPrompt,
  //       },
  //       {
  //         role: "user",
  //         content: "Remove workout 1 from the program.",
  //       },
  //     ],
  //     text: {
  //       format: zodFormat,
  //     },
  //   })
  //   const event = response.output_parsed
  //   expect(event).toBeDefined()
  //   const eventParsed = editOperationWrappedSchema.parse(event)
  //   expect(eventParsed).toBeDefined()
  // })

  it("ai sdk supports a remove operation with stream object", async () => {
    try {
      const { elementStream } = streamObject({
        model: openai(defaultModelLarger),
        output: "array",
        schema: editOperationWrappedSchema,
        system: exampleEditPrompt,
        prompt: "Remove workout 1 from the program.",
      })
      const allElements: EditWorkoutPlanActionWrapped[] = []
      for await (const element of elementStream) {
        expect(element).toBeDefined()
        // NOTE: something is up with the ai sdk zod schema parsing. Nullable doesn't work,
        // but the openai docs mentions that optional is NOT supported.
        const { success: successWrapped, data: dataWrapped } =
          editOperationWrappedSchema.safeParse(element)
        expect(successWrapped).toBe(true)
        expect(dataWrapped).toBeDefined()
        expect(dataWrapped?.operationToUse).toBe("remove")
        expect(dataWrapped?.remove).toBeDefined()
        expect(dataWrapped?.remove?.workoutId).toBe(
          "6b4cf510-e0a9-4634-ad5e-c082bb66ef61"
        )
        if (dataWrapped) {
          allElements.push(dataWrapped)
        }
      }
      expect(allElements.length).toBe(1)
    } catch (error) {
      // NOTE: Example error to handle from ai sdk docs
      // if (NoObjectGeneratedError.isInstance(error)) {
      // }
      expect(error).not.toBeDefined()
    }
  })
  it("ai sdk supports a remove operation with stream object", async () => {
    try {
      const { elementStream } = streamObject({
        model: openai(defaultModelLarger),
        output: "array",
        schema: editOperationWrappedSchema,
        system: exampleEditPrompt,
        prompt: "Remove workout 1 from the program.",
      })
      const allElements: EditWorkoutPlanActionWrapped[] = []
      for await (const element of elementStream) {
        expect(element).toBeDefined()
        // NOTE: something is up with the ai sdk zod schema parsing. Nullable doesn't work,
        // but the openai docs mentions that optional is NOT supported.
        const { success: successWrapped, data: dataWrapped } =
          editOperationWrappedSchema.safeParse(element)
        expect(successWrapped).toBe(true)
        expect(dataWrapped).toBeDefined()
        expect(dataWrapped?.operationToUse).toBe("remove")
        expect(dataWrapped?.remove).toBeDefined()
        expect(dataWrapped?.remove?.workoutId).toBe(
          "6b4cf510-e0a9-4634-ad5e-c082bb66ef61"
        )
        if (dataWrapped) {
          allElements.push(dataWrapped)
        }
      }
      expect(allElements.length).toBe(1)
    } catch (error) {
      // NOTE: Example error to handle from ai sdk docs
      // if (NoObjectGeneratedError.isInstance(error)) {
      // }
      expect(error).not.toBeDefined()
    }
  })
  it("ai sdk supports a remove operation with generate object", async () => {
    try {
      const response = await generateObject({
        model: openai(defaultModel),
        schema: editOperationWrappedSchema,
        system: exampleEditPrompt,
        prompt: "Remove workout 1 from the program.",
      })
      expect(response.object).toBeDefined()
      const { success, data } = editOperationWrappedSchema.safeParse(
        response.object
      )
      expect(success).toBe(true)
      expect(data).toBeDefined()
      expect(data?.operationToUse).toBe("remove")
      expect(data?.remove).toBeDefined()
      expect(data?.remove?.workoutId).toBe(
        "6b4cf510-e0a9-4634-ad5e-c082bb66ef61"
      )
    } catch (error) {
      expect(error).not.toBeDefined()
    }
  })
  it("ai sdk supports an insertAfter operation with generate object", async () => {
    try {
      const response = await generateObject({
        model: openai(defaultModelLarger),
        schema: editOperationWrappedSchema,
        system: exampleEditPromptForInsertAfter,
        prompt:
          "Duplicate the current workout and add it as Day 2 with all exercises, sets, reps, and rest periods identical.",
      })
      expect(response.object).toBeDefined()
      const { success, data } = editOperationWrappedSchema.safeParse(
        response.object
      )
      expect(success).toBe(true)
      expect(data).toBeDefined()
      expect(data?.operationToUse).toBe("insertAfter")
      expect(data?.insertAfter).toBeDefined()
      // id of workout 1
      expect(data?.insertAfter?.anchorWorkoutId).toBe(
        "81956bbc-cf1d-4d98-a769-d89c1c957ce1"
      )
      expect(data?.insertAfter?.workout).toBeDefined()
    } catch (error) {
      console.log(error)
      if (NoObjectGeneratedError.isInstance(error)) {
        log.consoleWithHeader("response", error.response)
        log.consoleWithHeader("cause", error.cause)
      }
      expect(error).not.toBeDefined()
    }
  })

  it("oct 5th troublesome prompt that was causing issues. (notes set as undefined)", async () => {
    const systemPrompt = stripIndent`
You are an ai assistant that translates a free-form, natural-language edit requests into a
validated JSON array of edit operations. As inputs, you are given a description of the current workout program, 
a list of supported exercises, and a text description of the requested changes to make. You will be given
the relevant schemas for the JSON response.

# General guidelines for the edit operations
- Every exercise referenced in the edit request MUST be matched to a real, provided exercise and reference its id.
Never invent exercises or ids. If the request names an unavailable exercise, select the closest
supported option by exact/synonym/sub-string match and use that exercise's canonical name and id from the list.
- When the request references a workout by position (e.g., "Day 2"), map via workout.program_order.
When it references by name, match case-insensitively to an existingworkout.name.
All operations MUST reference workouts by their UUID fields (anchorWorkoutId, workoutId, aWorkoutId, bWorkoutId).
- Allowed operations only: insertAfter, insertBefore, insertAtStart, insertAtEnd, swap, remove. DO NOT modify individual blocks inside existing workouts here.
- For newly inserted workouts, make sure the individual blocks adhere to the schemas. Use the exercises list to populate exercise ids
and canonical names. For exercise details, MAKE SURE to follow the training variables and notation as described below.
- For the 'notes' field in the structured response, ALWAYS return a string. If there are no notes, just return an empty string.

# Explaining an edit operation:

An edit operation type is determined by the operationToUse field. The valid values are:
- insertAfter
- insertBefore
- insertAtStart
- insertAtEnd
- swap
- remove

If the operationToUse is insertAfter, insertBefore, insertAtStart, or insertAtEnd, the corresponding field will be populated.
For example, if the operationToUse is insertAfter, the insertAfter field will be populated. If the operationToUse is swap, 
the swap field will be populated. If the operationToUse is remove, the remove field will be populated:

## Examples of valid edit operations
{ "operationToUse": "swap", "swap": { "aWorkoutId": "<uuid>", "bWorkoutId": "<uuid>" } }
{ "operationToUse": "remove", "remove": { "workoutId": "<uuid>" } }
{ "operationToUse": "insertAtStart", "insertAtStart": { "workout": "<workout to insert>" } }
{ "operationToUse": "insertAtEnd", "insertAtEnd": { "workout": "<workout to insert>" } }
{ "operationToUse": "insertBefore", "insertBefore": { "anchorWorkoutId": "<uuid>", "workout": "<workout to insert>" } }
{ "operationToUse": "insertAfter", "insertAfter": { "anchorWorkoutId": "<uuid>", "workout": "<workout to insert>" } }

# Training variables and notation
- Reps and weights can be represented as:
- Comma separated values e.g. "12, 10, 8"
- Ranges e.g. "10-12"
- Range and comma values e.g. "10-12, 10-16, 8-10"
- The "Each Side" (ES or E/S) annotation is used to represent exercises that are performed on each side. e.g. 12ES, 12-15E/S
- Rest periods use the "s" suffix to represent seconds, "m" to represent minutes e.g. "30s", "1m", "2m30s"
- Weight can be represented as:
- Numeric values e.g. "135"
- Bodyweight (BW) e.g. "BW"
- Bodyweight plus a value e.g. "BW+10"
- Bodyweight plus a range e.g. "BW+10-20"
- Bodyweight plus a range and a comma separated values e.g. "BW+10-20"
- Weight units default to lbs, unless coach preferences specify otherwise.
- Exercise circuits are represented using the "A1,A2,A3...An" notation. E.g. a circuit with 3 exercises would be represented as 
"A1:Exercise1,A2:Exercise2,A3:Exercise3".
- AMRAP is a special notation for exercises that are performed "As Many Reps As Possible".

# Example block schemas

## Exercise block example
{
"type": "exercise",
"exercise": {
"id": "<uuid from exercises list>",
"name": "<canonical name from exercises list>",
"metadata": {
"sets": "3",
"reps": "10,10-12,10-15",
"weight": "BW+10-20",
"rest": "1m30s",
"notes": "This is a note about the exercise"
}
}
}

## Circuit block example
{
"type": "circuit",
"circuit": {
"name": "Circuit 1",
"description": "This is a description of the circuit",
"metadata": { "sets": "3", "rest": "1m", "notes": "This is a note about the circuit" },
"exercises": [ <exercise blocks as above> ]
}
}

# Current workout program
Workout 1: Name: Last workout (id: 4989ec1e-2956-429e-a3fc-a1128ce6b603)
- Hammer Curl (id: a41a227a-9c12-49ec-bf46-c0a5a08287f9)
Sets: 4
Reps: 10-12
Weight: BW+10-20
Rest: 90s
Notes: Focus on controlled movement
- Cable Curl (id: c3ef1cef-7567-47b1-b00b-98d513301b59)
Sets: 4
Reps: 10-12
Weight: BW+15-25
Rest: 90s
Notes: Maintain consistent tension
- Cable Tricep Extension (id: 961ff670-b39c-4462-b369-1726b9a86d54)
Sets: 4
Reps: 10-12
Weight: BW+15-25
Rest: 90s
Notes: Full elbow extension
- Cross Body Tricep Extension (id: b27f15e0-58cd-4697-a973-d8bb860abf7d)
Sets: 3
Reps: 12-15
Weight: BW+10-20
Rest: 60s
Notes: Focus on triceps stretch
- Skull Crushers (id: ef2182d1-077b-4747-8495-b79896c80f4d)
Sets: 3
Reps: 10-12
Weight: BW+15-25
Rest: 90s
Notes: Use controlled tempo

# Exercise list
- Double Leg Calf Raise w/Step (id: 37a20c73-39d7-486d-b6d7-7a35c88b5fa3)
- Single Leg Calf Raise w/Step (id: 109975fe-1901-4666-a1b7-1f837e9292d9)
- Calf Raises w/Knees Bent (id: b03f7c37-8ec9-43d2-95fa-3cababbfe4f9)
- Heel Elevated Squats (id: c1d9ca3b-1921-470d-bd61-1a9b4ac9e55c)
- Leg Extensions (id: 0b743f5c-7e77-42ec-8706-90c356b5a4e1)
- Walking Lunges (id: c68d68be-63a7-4e18-80dc-b587506bfb08)
- Reverse Lunges (id: 33ec2d50-15dc-49a4-a203-d42792b79bd0)
- Split Squats (id: 1f9d314b-0ede-4b5d-b1d8-f1a07d1e08eb)
- Single Leg Squats (id: 78f52cbe-5387-4aa7-b203-81cd551d397a)
- Hamstring Curls (id: 8b492eb3-9b21-453b-9e95-ad89e8fbc41b)
- RDLs (id: 4301b60b-0d31-4904-8b8a-081b33db4069)
- Walking Lunges (id: 9e043e02-1c29-4039-a45f-cbfb5d622f6a)
- Reverse Lunges (id: 02157acc-22b1-4c79-96fc-4d64edd0be73)
- Split Squats (id: c901e481-cfd9-42d6-af73-c53f5ae242f4)
- Hip Thrusts (id: 383a9170-1edf-49af-9134-fac82669af97)
- Crunches (id: 622c8978-090a-4699-a36b-cd29e66227a8)
- Reverse Crunches (id: 79dfa49e-5604-43af-bc0c-ca0697b06419)
- Hanging Knee/Leg Raises (id: b247bd98-1aa0-4990-bebb-0552a053f553)
- Leg Raises (id: 1c9615f7-535b-4766-8838-07e9c3c9074d)
- Crunch Pullthroughs (id: 35ccae47-c049-4d71-a7f7-a7f151124f82)
- Pull Ups (id: c39e1a21-2618-47bf-88b3-15bc5e94d3e7)
- Lat Pull Downs (id: 311dce1f-8ad1-4469-8410-875789ea9d1a)
- Cable Pullover (id: bb0dc6ee-fe63-4416-85ec-720ea6879f27)
- Dumbbell Pullover (id: 7a940739-132f-405c-93ef-43723b4d8fd6)
- Cable Row (id: aa70038a-6b68-4511-b31a-5ef89f30b1fb)
- TRX Row (id: 9f741413-d56b-4857-a101-e871d6818b4f)
- Dumbbell Rows (id: 4abe1cbf-c965-497b-a6eb-f8b032647a5e)
- Chest Supported DB Rows (id: fb3e6501-1950-4d8a-8e55-1da21c2f6683)
- Face Pulls (id: aed3efb0-0188-45d9-93f1-5aaeeddc9a30)
- Rear Delt Flys (id: b7c051ab-ba49-4461-baf5-a9f5a1275f73)
- Shrugs (id: 651bdbd9-9f05-4aef-875d-1f5b3b254ce2)
- Bench Press (id: 723ba1af-7151-4db1-9a8a-9627bdc5e3b6)
- Dumbbell Press (id: ba9e52ba-10fe-45ba-bc21-e34bcaa37865)
- Smith Bench Press (id: 3e11680b-1e86-4a95-bc2b-e10b04615b5c)
- Incline Smith Bench (id: 92c57f27-78d6-4ce7-94b6-55b5828b0c66)
- Incline Dumbbell Press (id: cfb8f4ef-bd5a-4a64-9302-7e029689ebf0)
- Pushups (id: 8f18f04d-ce77-434f-a486-91db8139e180)
- Pushups w/Bar (id: 72699b26-b37c-4004-a3b0-c4b335c86c6b)
- TRX Pushup (id: 9a70d80a-7201-4945-a9c0-2886d865a989)
- Cable Fly/Press (id: fb48b8fe-9eb6-426f-81e0-2762c3bef12b)
- Incline Cable Fly/Press (id: 6a01c709-94fe-41a3-bbf3-84f34437c18a)
- Dips (id: 892ee357-e2d9-40a3-a9e9-5f73909062e9)
- Overhead Press (id: a204f27a-fd38-48ec-a99b-f9344cadbd12)
- Dumbbell Lateral Raise (id: 15bd400b-dbce-4e7a-956d-463e17a5c1e4)
- Cable Lateral Raise (id: 4142bc6d-a96b-4a8c-97bb-45e95e283f77)
- Front Raise (id: 045611f6-699f-4a5a-b426-dc8971021f88)
- Face Pulls (id: 7fa9823b-6177-4ea7-b375-698e17a382bf)
- Barbell Curl (id: ee4edee4-113b-4f69-8cef-915a2bc89f51)
- Dumbbell Curl (id: c19a2b68-5705-4b8e-a6cb-f09261c7d0b6)
- Cable Curl (id: c3ef1cef-7567-47b1-b00b-98d513301b59)
- Cable Full ROM Curl (id: d3f9cf29-7029-464d-bebe-05737cf69126)
- Hammer Curl (id: a41a227a-9c12-49ec-bf46-c0a5a08287f9)
- Rev Grip Curl (id: 3cba23f8-fb35-4601-b2f7-4912763b34b5)
- Cable Tricep Extension (id: 961ff670-b39c-4462-b369-1726b9a86d54)
- Cross Body Tricep Extension (id: b27f15e0-58cd-4697-a973-d8bb860abf7d)
- Skull Crushers (id: ef2182d1-077b-4747-8495-b79896c80f4d)
- Close Grip Bench (id: 6cf92245-78fb-4ec6-b8b4-8202cfacff12)
- Dips (id: 13f62034-9008-4526-9ce9-36c56c9ca647)
- Double Leg Calf Raise w/Ground (id: 837e9df5-833d-43c3-bae8-c76d02d2e445)
- Squats (id: 9b6de57e-3aa2-4548-8209-d44eea4db1c4)
- Box Step Ups (id: 960fbc21-e182-4bd9-b243-1328f7a06c4b)
- Weighted Jumps (id: 4dbf4d89-b1a9-4d1a-a9c0-cdfa48f88720)
- Nordic Ham Curls (id: f5a3237b-8ec5-4a14-94e0-9e9d006c2b38)
- RDLs (id: 63476f83-cc7b-4214-b0b1-22862afb3760)
- Deadlifts (id: 107ee569-90b1-47f4-83c7-b12b953fca76)
- Squats (id: bae7dc88-1f25-4d26-bab4-636f1eb7ea14)
- Deadlifts (id: ad1001f4-0189-478d-8d31-d5144e7e2e4e)
- Box Step Ups (id: 50279680-e4ce-47ee-9cfa-3ca81ec68bd2)
- Lower Back Flexion (id: e7337b10-b263-4235-b523-7aae09ae7115)
- Deadlifts (id: d0577319-7628-4aaf-846a-61809e6c1e28)
- Pull Ups (id: a47d0809-ce0c-4452-bd30-936433da1864)
- Barbell Rows (id: cb31eceb-05ef-4272-be59-4c6556aed89d)
- Dumbbell Rows (id: 73f147e2-5a29-43b8-a9c8-5a58dead43ac)
- Bench Press (id: d9013b32-11a5-4427-9097-5294d959dc94)
- Dumbbell Press (id: 85c58b83-c672-49c8-80f1-bf370d761ca4)
- Pushups (id: b2431b21-ebe2-4eda-a30c-ced901908c89)
- Dumbbell Overhead Press (id: f539d4c0-08ef-44f1-9a7e-dbcbb7c1c6f6)
- Barbell Overhead Press (id: 752c4a98-c61a-466d-a97e-0131d65472df)
- Single Leg Balance w/Foam (id: 1b10d771-7235-4b8b-bfdb-674a09bb1a55)
- Y Balance (id: 954280b1-692f-4729-b10e-4406cac3facb)
- 2 Tool Rotation (id: 6ef0fcea-cc59-48f2-b2a9-77ea0a1936e8)
- Lateral Step Downs (id: 57769551-2589-4a0a-b1aa-f3f60e6bd27e)
- Single Leg Squats (id: 3e8c19d7-7390-4aaa-b1b9-8e5113623545)
- Spanish Squats (id: adfffa08-7c58-416b-8a9b-b3e864ce44dc)
- Single Leg RDLs (id: 871ca6e5-c39e-4bdf-a1e9-c446be844c90)
- Single Leg Bridge (id: 5d834d06-a077-41e4-85c0-d5ab47ba033e)
- Birddog (id: 7f2c350f-beea-46b4-b705-c5549b38ab7c)
- Birddog Row (id: f01cd06c-b40b-4ed7-b125-9a6ce2c30ce2)
- Plank w/Lift (id: e2617cfe-4b63-43ea-a562-a593f2244913)
- Plank w/Knees Touch Elbows (id: 3dd3722c-2730-4257-8ce0-26dcc879f819)
- Side Plank w/Lift (id: 09f82801-0878-4c9c-ba0c-8cff4b8a3ea5)
- Side Plank w/Cable Row (id: 8d2f73f3-5ff7-46f2-bc02-3d4b0dab01c7)
- Side Plank w/Hip Dip (id: 90ec2cda-cc63-494a-ab34-2d0d6e5c1065)
- Plank w/Yoga Ball (id: 21c28fb5-0d84-4227-95f5-52cc7b9eff28)
- Copenhagen Plank (id: b6fd6d41-dab6-413f-9867-31d6108c2bb6)
- Pallof Press (id: d220b341-0ae6-4719-908a-8533385802de)
- Anti-Rotation Walkouts (id: 7c969723-9eda-4a7b-bd12-b1aceb1d746f)
- Suitcase Carry (id: 88c66aad-8efa-4448-a177-5746ed5fe38e)
- Chaotic Suitcase Carry (id: 397a218e-8302-4644-a14f-d57dde6512fc)
- SL RDL (id: f0ae06d6-efa0-4ae9-8f52-83d6e195c043)
- Marching w/Foam Roller (id: 6c27e904-f841-4eb1-bd32-1818f65f345f)
- Side Plank (id: 7be64b96-9c8d-4f3e-a47c-274d6e2e8083)
- High Er Y (id: 2d810a90-faa6-4c9c-9ad9-25db770fa1e6)
- Rev Kettlebell Carry (id: 4458f5ef-09b5-45fb-b4ca-201e2112f828)
- Banded Dorsiflexion (id: 8a03c471-538e-4cac-b670-2530594c6c8e)
- Weighted Dorsiflexion (id: 3720f406-42fd-4c7b-a416-9a2e501a2266)
- Child Pose w/Plantarflexion (id: 3411bd64-b7b7-4dd6-a323-a74b6b37336f)
- Toe Extensions (id: a01c584f-f0b2-480c-b13c-291e8c1341b6)
- Gastroc Stretch (id: 0b2e8a8f-8293-4860-b1fa-c438b345a93c)
- Soleus Stretch (id: 083ac146-10ed-4641-b965-46346aefe362)
- ATG Split Squat (id: 1c5a5dfe-5a45-4465-ade0-dcff9dfa096e)
- Prone Quad Stretch w/Strap (id: 53bedb7a-e938-452b-a67b-a68ef93bbb9b)
- Quad Sets (id: e2247da9-464a-4381-85e4-ce8563ba42e3)
- Heel Slides (id: 9e42d8ad-bbe8-45e6-ae35-4c4c579f3366)
- ATG Split Squat (id: ba20d3ca-95f8-4555-9dbe-4a71434c133e)
- Hamstring Stretch w/Rotations (id: 39750879-ec16-4762-b189-935b5cf476c4)
- Seated Hamstring Stretch (id: cb0958d3-4b65-4949-ba46-ed5d419f1b38)
- Falling 4's (id: 7a16bd72-e030-42f7-952a-df44203d0faf)
- Piriformis Stretch (id: f6cf29d4-2cc0-44d0-8fb3-ffb8d08d3c33)
- Falling 4/Piriformis Combo (id: be698c1e-ee0e-4f84-930c-c6413364287f)
- Lunge Stretch (id: b1e45a00-1db8-45f3-857f-82c0fc1a37f4)
- Couch Stretch (id: a68529b1-cc06-4b73-8115-369294a11149)
- Half Frog Stretch (id: 4f16ed87-162f-4b17-bb6d-c4437ac67354)
- Hip Airplane (id: 76704c44-3da4-463c-88a8-988afb627a8a)
- Banded Hip Mobilization (id: 4eaf0719-6ebc-429f-ad17-1415096061de)
- 3-Way Child Pose (id: 782af14f-a647-42e8-a818-c62fae517d14)
- QL Stretch (id: 6afdb424-0296-4676-86fc-299df59a4086)
- Open Books (id: 36d30a9c-162b-4bdc-aeb5-43b936732d0e)
- Thread Needle (id: 05bd3ffb-bd13-4eeb-8ee4-c00bec81557e)
- Doorway Pec Stretch (id: 9f669e47-689f-4c9e-9fdd-a650d284c4aa)
- Bar Hangs (id: ac98c146-36ff-4923-8875-0cc1546c3452)
- Uppercuts w/Fr (id: bb050925-f91e-4895-8604-3d40ba08e549)
- Cross Body Stretch (id: 9bdde578-0db3-4397-b02a-fac13b4c7b49)
- Sleeper Stretch (id: 0153c2d3-7c72-40b2-8d45-823a23b908b1)
- Lift Offs (id: eebdc6bb-4c86-46e1-a50f-119dcd1095c1)
- Behind Back Towel Pulls (id: 0f97276b-829e-48d1-9eb7-68b88f2bbac1)
- Reverse Sweeps (Peroneal Strength) (id: 40373bdb-e6ee-4e94-a6d9-8bad74d8f8bb)
- Sweeps (Posterior Tibialis Strength) (id: 82de3062-df40-450f-9bad-03c1b41b7b32)
- Toe Raises (Anterior Tibialis Strength) (id: 797c2ce6-c5bc-41cc-a136-eab43ffa3653)
- Terminal Knee Extension (id: 4342c5b3-b007-4586-b367-09e5f3b817ec)
- Quad Sets (id: eee9ccee-9703-4134-a790-899c69476682)
- Hamstring Towel Curls (id: 8d7908d0-88ac-4232-b2a5-714ccfae5284)
- Heel Slides (id: 9c4cb309-5a85-42f5-80fd-1648797750bd)
- Ball Squeeze (id: 157b98b8-bbc1-45ad-a0fa-3a3a4511260a)
- Copehagen Plank (id: 8b05ae16-9c0c-4fa3-804f-6aafe3e473ee)
- Supine Hip Flexion (id: b2bbb7f4-e3fc-4118-8953-f0efd1aeb21b)
- Side Lying Leg Raises (id: bf239483-1392-4f48-abe2-85457ca05d67)
- Cable Hip Abduction (id: 62b7d6d3-7a3f-4ea9-8695-d89dfe603b0f)
- ITY's (id: 3d9f1923-5260-40da-87c8-5d00a22f5167)
- Pushup Plus (id: 6799dd4d-a172-419e-b739-fa57e320eb1b)
- Full ROM Row (id: 866b146c-f9dd-4373-a90e-f642fd2f825c)
- High ER Y (id: d93a5f34-da87-4f0b-a314-ad84e7848fb9)
- No Moneys (id: 6c62c239-4c28-4d97-b225-b9448519af01)
- ER @ Neutral (id: 11db5143-b347-4282-9435-2d1ae707410d)
- IR @ Neutral (id: 723ce6c3-4366-4251-98eb-11a3dfcd634f)
- ER @ 90 (id: 1ccac44e-7101-455e-9cff-42ac031f6add)
- IR @ 90 (id: f361b5d3-c2d7-48fd-88e0-b48c27d0befc)
- Snow Angles (id: 068d8fb7-d8e5-42ca-8892-714b3f1b9b7d)
- Abduction Upper Cuts w/FR (id: 70f25850-1df9-4642-b1b0-e76335f0e105)
- Lock 3 (id: 144477c3-880d-4179-9d4c-9ba6de0238f2)
    `
    try {
      const response = await generateObject({
        model: defaultModel,
        schema: editOperationWrappedSchema,
        system: systemPrompt,
        prompt: stripIndent`
          Add a new workout titled 'Full Body A' with the following structure:
          - Squats: Sets: 3, Reps: 8-10, Weight: 135-165, Rest: 2m
          - A1: Bench Press: Sets: 3, Reps: 8-10, Weight: 95-135, Rest: —
            A2: Chest Supported DB Row: Sets: 3, Reps: 10-12, Weight: 35-50, Rest: 90s after A2
          - B1: Calf Raises w/Step: Sets: 3, Reps: 12-15, Weight: BW+25, Rest: —
            B2: Crunches: Sets: 3, Reps: 15-20, Weight: BW, Rest: 60s after B2
          `,
      })
      expect(response.object).toBeDefined()
      const { success, data } = editOperationWrappedSchema.safeParse(
        response.object
      )
      expect(success).toBe(true)
      expect(data).toBeDefined()
      expect(data?.operationToUse).toBe("insertAtEnd")
      expect(data?.insertAtEnd).toBeDefined()
    } catch (error) {
      console.log(JSON.stringify(error, null, 2))
      throw error
    }
  })
})
