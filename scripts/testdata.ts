import type { ContextItem } from "@/lib/ai/prompts/context-schema"
import type { Workouts } from "@/lib/domain/workouts"

const testExercises: ContextItem[] = [
  {
    type: "exercises",
    data: {
      exercises: [
        {
          id: "381facbb-912c-4212-9842-9d173be77fd0",
          name: "Double Leg Calf Raise w/Step",
        },
        {
          id: "5fdd9135-cd45-4695-8968-b62a0f34c757",
          name: "Single Leg Calf Raise w/Step",
        },
        {
          id: "b4711ec3-d3b5-43ef-a2bd-a29d6bfd4caa",
          name: "Calf Raises w/Knees Bent",
        },
        {
          id: "149beb8e-245b-434e-81e9-f53507bf2381",
          name: "Heel Elevated Squats",
        },
        {
          id: "516e0990-972e-496d-b4d1-4950d4c54451",
          name: "Leg Extensions",
        },
        {
          id: "cac69f34-f8c1-42ba-bcfc-282028d2ada5",
          name: "Walking Lunges",
        },
        {
          id: "fdd06654-a295-4b72-a2fb-b1585fcb3dc5",
          name: "Reverse Lunges",
        },
        {
          id: "43338045-a2de-4f4a-b0f8-4f2d0c50eeaf",
          name: "Split Squats",
        },
        {
          id: "e039aeb1-0f02-468f-9204-30e9ef36b779",
          name: "Single Leg Squats",
        },
        {
          id: "328fd061-4c28-4c7f-997a-3292e8bae656",
          name: "Hamstring Curls",
        },
        {
          id: "3de6e1bf-2731-4671-9ea1-dd64550f22da",
          name: "RDLs",
        },
        {
          id: "36e83a00-e473-459b-89af-a73f90209f67",
          name: "Hip Thrusts",
        },
        {
          id: "fc7b5d94-3dfe-4d2a-a7ce-113e76a419a2",
          name: "Crunches",
        },
        {
          id: "8a26e2f2-1945-4670-969d-da287d550706",
          name: "Reverse Crunches",
        },
        {
          id: "27ec70ca-8c2c-493d-85f2-e9e66b6627b3",
          name: "Hanging Knee/Leg Raises",
        },
        {
          id: "5164c58a-5792-4b01-998c-4e5ae1517e61",
          name: "Leg Raises",
        },
        {
          id: "5072532d-057e-4257-acd0-be7be806fd72",
          name: "Crunch Pullthroughs",
        },
        {
          id: "39fc2ecb-e907-432d-9036-9c39e80001f5",
          name: "Pull Ups",
        },
        {
          id: "97d5613b-d082-4be8-bb94-9ff5f6d06390",
          name: "Lat Pull Downs",
        },
        {
          id: "63afe361-3ef1-4fb8-b1be-aa8c769a169c",
          name: "Cable Pullover",
        },
        {
          id: "c225c0d7-cb0c-4bbe-a424-aaf99faa1c06",
          name: "Dumbbell Pullover",
        },
        {
          id: "ffd82cea-9f37-4716-af5c-dbe8f77a27b3",
          name: "Cable Row",
        },
        {
          id: "b0b8b2fd-7f36-45ac-acb8-60d0285ced6b",
          name: "TRX Row",
        },
        {
          id: "dd1a3f04-8a56-4f6a-9300-3052522ba97d",
          name: "Dumbbell Rows",
        },
        {
          id: "ac53850e-b6b4-4204-8691-be92e69836be",
          name: "Chest Supported DB Rows",
        },
        {
          id: "65d6e7b6-a025-4cf3-ad21-e78d65fa1c34",
          name: "Face Pulls",
        },
        {
          id: "ff8ce220-8db4-4ef2-95e5-afdb7a045929",
          name: "Rear Delt Flys",
        },
        {
          id: "555209bc-ec22-4d44-9fe7-2d71ba1211ad",
          name: "Shrugs",
        },
        {
          id: "d22e9903-267a-436e-9384-562cda4f7623",
          name: "Bench Press",
        },
        {
          id: "3bb08729-d529-4475-b719-bc419b30ac09",
          name: "Dumbbell Press",
        },
        {
          id: "cdec8381-7afb-4d0a-b694-0e2a7aadae24",
          name: "Smith Bench Press",
        },
        {
          id: "85c463a2-0bb8-4618-a861-90e900a30787",
          name: "Incline Smith Bench",
        },
        {
          id: "89813d70-ecd2-4d13-9998-5972a99198a6",
          name: "Incline Dumbbell Press",
        },
        {
          id: "0561614e-1119-4b50-befe-91e3360843b1",
          name: "Pushups",
        },
        {
          id: "05206bb9-4ba2-4188-b440-221004bf12a4",
          name: "Pushups w/Bar",
        },
        {
          id: "2931b07d-394f-4602-a051-07859695fe83",
          name: "TRX Pushup",
        },
        {
          id: "b8540b44-6e22-417d-8440-cdfe6adc3a73",
          name: "Cable Fly/Press",
        },
        {
          id: "d5cae121-554f-48fe-b3b6-63abcd295eeb",
          name: "Incline Cable Fly/Press",
        },
        {
          id: "d6cef272-ac18-46d5-8154-8ff5d6ffaafe",
          name: "Dips",
        },
        {
          id: "baf8ddda-b6ef-4d69-b543-07fd2f6a0f97",
          name: "Overhead Press",
        },
        {
          id: "1b9e8981-51f2-4da2-946a-c0a57797fff6",
          name: "Dumbbell Lateral Raise",
        },
        {
          id: "a20b030c-264b-423a-a2b6-6784cfdfab24",
          name: "Cable Lateral Raise",
        },
        {
          id: "9e7e0144-338f-4eb1-a3a0-62c4e655391c",
          name: "Front Raise",
        },
        {
          id: "d0565ec0-88b8-4fe5-bd4a-7b35776e9a8b",
          name: "Face Pulls",
        },
        {
          id: "a64f5814-0300-4bbc-928b-04c2a4c4f57f",
          name: "Barbell Curl",
        },
        {
          id: "d76e8c9b-0508-4cd9-b10b-6df56b3dc76d",
          name: "Dumbbell Curl",
        },
        {
          id: "c2631198-e3a2-4985-84c1-ab1cf9656331",
          name: "Cable Curl",
        },
        {
          id: "c9c2924f-ad41-4db8-a29c-85356ff8a814",
          name: "Cable Full ROM Curl",
        },
        {
          id: "8cb4fbeb-6c61-4257-90bc-99a5ffbbe679",
          name: "Hammer Curl",
        },
        {
          id: "5d01b148-38b0-4b1d-8238-ac3c6d8b5e5e",
          name: "Rev Grip Curl",
        },
        {
          id: "5b0898e1-5147-41c1-9924-340c227d7d78",
          name: "Cable Tricep Extension",
        },
        {
          id: "f16c815e-394b-452e-aa1f-30f22924e0d3",
          name: "Cross Body Tricep Extension",
        },
        {
          id: "54a44144-6f62-4f09-bdb1-955fe4ecd35c",
          name: "Skull Crushers",
        },
        {
          id: "50f935e4-1e09-4298-9574-d6f2c408a318",
          name: "Close Grip Bench",
        },
        {
          id: "721f2f1d-65f4-4f5c-bfaa-d58ffeef23de",
          name: "Dips",
        },
        {
          id: "2a00b38c-4468-435e-ad2f-e97cd5863551",
          name: "Double Leg Calf Raise w/Ground",
        },
        {
          id: "21b214ad-5938-4c69-9222-1903538be63b",
          name: "Squats",
        },
        {
          id: "e90b2498-6dac-4686-86ca-bd5a65c0227a",
          name: "Box Step Ups",
        },
        {
          id: "8c53a5e8-afd3-4460-b2d7-ea962519efc2",
          name: "Weighted Jumps",
        },
        {
          id: "629e9494-9c7f-46e0-ada2-06f1a3544ce4",
          name: "Nordic Ham Curls",
        },
        {
          id: "afbf1bf6-6a65-4774-8295-d94bdec328d0",
          name: "RDLs",
        },
        {
          id: "2875c815-a81c-4f56-9ac3-b3ffc424fdfc",
          name: "Deadlifts",
        },
        {
          id: "0924c822-f402-4f8f-8463-092575e2ca88",
          name: "Squats",
        },
        {
          id: "53d1b18f-0ee4-43f4-8026-03a87b15ea37",
          name: "Deadlifts",
        },
        {
          id: "0c75ecb6-c49f-491a-813f-7badb16f67ed",
          name: "Box Step Ups",
        },
        {
          id: "6cff3282-7ca2-4d34-b4a1-545fdd4c5afa",
          name: "Lower Back Flexion",
        },
        {
          id: "e2b8768c-4b34-477c-bfbe-122c6e3e5e5f",
          name: "Deadlifts",
        },
        {
          id: "0f1ee014-0281-44c6-b13b-0e08f75bd966",
          name: "Pull Ups",
        },
        {
          id: "400fcb76-daa2-4fb4-a8ff-67642d42aa0c",
          name: "Barbell Rows",
        },
        {
          id: "aaa1c06e-ca17-4789-b865-8b36092307fa",
          name: "Dumbbell Rows",
        },
        {
          id: "35599ffc-5245-42bc-ae36-70d6b541eae1",
          name: "Bench Press",
        },
        {
          id: "d79bb846-915d-41e8-8833-e83469c18086",
          name: "Dumbbell Press",
        },
        {
          id: "b6162635-3999-4961-9acf-2398193118de",
          name: "Pushups",
        },
        {
          id: "1cde63fa-b1e9-4374-bb1a-b7801cc96559",
          name: "Dumbbell Overhead Press",
        },
        {
          id: "489d5ba4-48c7-4741-97c7-c50718052d0d",
          name: "Barbell Overhead Press",
        },
        {
          id: "8095687b-dc1e-4103-a27b-f7df3c373e7e",
          name: "Single Leg Balance w/Foam",
        },
        {
          id: "f4b821a9-4726-486c-9c8b-5d60e987c788",
          name: "Y Balance",
        },
        {
          id: "5216863a-2572-40ef-832b-9c1047130e60",
          name: "2 Tool Rotation",
        },
        {
          id: "0fabe9d3-7de4-4e22-af68-8cd22b7308c5",
          name: "Lateral Step Downs",
        },
        {
          id: "b28afa2c-e846-4441-8a64-721b449acffe",
          name: "Single Leg Squats",
        },
        {
          id: "d1f58c0b-12db-45ef-9b1b-3a63c67dc311",
          name: "Spanish Squats",
        },
        {
          id: "565e72f8-f017-4b10-8770-b2567e859ebe",
          name: "Single Leg RDLs",
        },
        {
          id: "9fe85154-f677-4fa4-9f25-ad9035f7ba3c",
          name: "Single Leg Bridge",
        },
        {
          id: "049d4216-b62d-4f18-8c91-7d50a9ae4768",
          name: "Birddog",
        },
        {
          id: "b4d31c53-9c22-4c2d-860f-dd281678f367",
          name: "Birddog Row",
        },
        {
          id: "2d8d2e3e-13f8-46ab-a049-37d67cf4845b",
          name: "Plank w/Lift",
        },
        {
          id: "970d8e4d-298f-4722-9abe-6cb299249058",
          name: "Plank w/Knees Touch Elbows",
        },
        {
          id: "245624e2-0982-42c3-906c-1cb52a122f23",
          name: "Side Plank w/Lift",
        },
        {
          id: "58f38b7a-8cf6-47ad-bd33-aad3c8d93e9a",
          name: "Side Plank w/Cable Row",
        },
        {
          id: "a1d8475d-8bb2-4a3e-abc3-37ac2835b7a6",
          name: "Side Plank w/Hip Dip",
        },
        {
          id: "11725f25-efea-4691-8287-75c03a8a2082",
          name: "Plank w/Yoga Ball",
        },
        {
          id: "ec0cc6a3-186e-44eb-acb7-79740b882833",
          name: "Copenhagen Plank",
        },
        {
          id: "f288f07d-fe73-46c2-8f14-dec3166825db",
          name: "Pallof Press",
        },
        {
          id: "25427280-3ed0-44d0-8928-f27e8b076220",
          name: "Anti-Rotation Walkouts",
        },
        {
          id: "e9f1f202-ba07-4e41-85d9-5e4e9618ab92",
          name: "Suitcase Carry",
        },
        {
          id: "9c5b968b-0c51-41f3-8397-f490b0ce9619",
          name: "Chaotic Suitcase Carry",
        },
        {
          id: "42b7919a-eca4-454d-80a8-2c18212a199e",
          name: "SL RDL",
        },
        {
          id: "93e0980e-8b74-493d-8a4d-b2585373e917",
          name: "Marching w/Foam Roller",
        },
        {
          id: "19b02e70-c8b6-466e-90e1-1295828c910d",
          name: "Side Plank",
        },
        {
          id: "9ead6dff-0595-41d6-b094-81459f29a20e",
          name: "High Er Y",
        },
        {
          id: "044b8ffe-14e0-4def-8115-36daddfc9c89",
          name: "Rev Kettlebell Carry",
        },
        {
          id: "97f5ac9e-4294-4802-b265-251350732b2c",
          name: "Banded Dorsiflexion",
        },
        {
          id: "b9063654-4f16-41d8-9273-ae40b41a8687",
          name: "Weighted Dorsiflexion",
        },
        {
          id: "db291634-86d9-4436-9eb4-c29fd8635114",
          name: "Child Pose w/Plantarflexion",
        },
        {
          id: "98bd53b3-52ea-4a3d-8186-b86fac974805",
          name: "Toe Extensions",
        },
        {
          id: "cfcce732-8294-4a5d-9a79-bf004fd63340",
          name: "Gastroc Stretch",
        },
        {
          id: "466ab661-be67-4cd8-87e2-e7141358ce1a",
          name: "Soleus Stretch",
        },
        {
          id: "bf912539-0fa3-4e5f-8f12-6abac35f2896",
          name: "ATG Split Squat",
        },
        {
          id: "8be3fb1e-0e7c-4667-a91e-4ad0f3aaf4a7",
          name: "Prone Quad Stretch w/Strap",
        },
        {
          id: "3b1532e7-6133-436e-ba6b-8b36471b677d",
          name: "Quad Sets",
        },
        {
          id: "2112580d-248b-4715-b86e-d5583395ff1c",
          name: "Heel Slides",
        },
        {
          id: "153f1f3b-a76c-4f11-9e2c-14718ee1c5d2",
          name: "ATG Split Squat",
        },
        {
          id: "cd21e8e1-7643-40de-8f91-2b41244045e7",
          name: "Hamstring Stretch w/Rotations",
        },
        {
          id: "f0f06d66-c37b-4e39-ac0d-59f4119221ad",
          name: "Seated Hamstring Stretch",
        },
        {
          id: "614d55fa-2da0-482d-8312-efea30f0ef6c",
          name: "Falling 4’s",
        },
        {
          id: "5b4ad7fe-09e5-4417-942d-4bf924e73a22",
          name: "Piriformis Stretch",
        },
        {
          id: "1a2c73ff-6499-4fac-8e0d-cec5c98f687a",
          name: "Falling 4/Piriformis Combo",
        },
        {
          id: "3ed4cfdf-a8df-4acd-a9c8-645622581ea8",
          name: "Lunge Stretch",
        },
        {
          id: "7e892bf8-b10c-4855-9429-f14fd583b0ec",
          name: "Couch Stretch",
        },
        {
          id: "2d848b9d-b3f0-4819-9a09-105b46e67029",
          name: "Half Frog Stretch",
        },
        {
          id: "6077b307-d75c-4360-acd2-890749151497",
          name: "Hip Airplane",
        },
        {
          id: "017c06a6-5e8c-4403-b541-057daf92e316",
          name: "Banded Hip Mobilization",
        },
        {
          id: "21d2204e-f936-4278-a1db-b8c89d73706e",
          name: "3-Way Child Pose",
        },
        {
          id: "0227fa92-067c-449e-b4d8-2d2462511e90",
          name: "QL Stretch",
        },
        {
          id: "ced9860e-7d43-4cbf-824d-debb0a820531",
          name: "Open Books",
        },
        {
          id: "116a9f60-aebe-4c0d-aae7-684df552a7e2",
          name: "Thread Needle",
        },
        {
          id: "9d23b9cd-16a8-43e8-bf31-153f3ac946dd",
          name: "Doorway Pec Stretch",
        },
        {
          id: "760e7445-8b8c-4e6f-b1d8-2af480ff0164",
          name: "Bar Hangs",
        },
        {
          id: "379a755d-f6c4-44a8-9b0d-e1b07fa0f83d",
          name: "Uppercuts w/Fr",
        },
        {
          id: "ec66db62-54ae-4ce1-8b0c-d65c6b3b45ff",
          name: "Cross Body Stretch",
        },
        {
          id: "eefc380d-7fef-4d67-86c4-c58961917ee5",
          name: "Sleeper Stretch",
        },
        {
          id: "7c930330-b29c-4806-8b7e-5ba2b120c10b",
          name: "Lift Offs",
        },
        {
          id: "57b6bd84-f1aa-41d1-9a8e-bb659e7eaa6e",
          name: "Behind Back Towel Pulls",
        },
        {
          id: "36df1bff-f374-4abc-878c-956e9695cf2b",
          name: "Reverse Sweeps (Peroneal Strength)",
        },
        {
          id: "a631c930-17fe-46c1-8bb9-f7519e631bb5",
          name: "Sweeps (Posterior Tibialis Strength)",
        },
        {
          id: "c5142f9d-0c2b-4e4d-841c-3f260156204d",
          name: "Toe Raises (Anterior Tibialis Strength)",
        },
        {
          id: "d4b608df-9585-444b-837c-b80134c33df7",
          name: "Terminal Knee Extension",
        },
        {
          id: "fc72bcbc-d809-4148-8cc2-6211054b13d6",
          name: "Quad Sets",
        },
        {
          id: "a80f6a27-76d0-42fc-b093-002b0d48a7c3",
          name: "Hamstring Towel Curls",
        },
        {
          id: "54989174-7479-4917-aca9-6339f541b010",
          name: "Heel Slides",
        },
        {
          id: "791ffffd-7c9e-4d94-85bb-8753a684e5a2",
          name: "Ball Squeeze",
        },
        {
          id: "baddfb2a-6ce2-422c-98a7-8af301ed30f7",
          name: "Copehagen Plank",
        },
        {
          id: "c25edc64-c997-4462-b622-61779ad94cee",
          name: "Supine Hip Flexion",
        },
        {
          id: "2a10d826-505e-4be8-99b1-568fb9f6c265",
          name: "Side Lying Leg Raises",
        },
        {
          id: "7dd2a4df-1636-4a96-8e44-6b3f86f83bd7",
          name: "Cable Hip Abduction",
        },
        {
          id: "b05d597e-e238-494c-a654-71d7b8af565d",
          name: "ITY’s",
        },
        {
          id: "9779e9f3-737f-4b0b-9dc0-7cbac1e5ea21",
          name: "Pushup Plus",
        },
        {
          id: "c689b3d1-b521-4349-a14c-b71a43d7bba7",
          name: "Full ROM Row",
        },
        {
          id: "5d7e3feb-ba83-4f55-a2ff-514a5e66117a",
          name: "High ER Y",
        },
        {
          id: "ad8e3f0d-a996-4864-ab9f-2dd34f5f60ad",
          name: "No Moneys",
        },
        {
          id: "29f04a98-e578-4196-99d5-de3dc3655b26",
          name: "ER @ Neutral",
        },
        {
          id: "d17cd694-785d-426b-b50a-6857e6908d8a",
          name: "IR @ Neutral",
        },
        {
          id: "3f7e8519-326b-4dc4-b3bd-97e5e8c81578",
          name: "ER @ 90",
        },
        {
          id: "b9359a94-894e-4172-889c-beb24aeda5ce",
          name: "IR @ 90",
        },
        {
          id: "98f0e418-6817-4fa2-b0a2-bd5d6f124c6f",
          name: "Snow Angles",
        },
        {
          id: "2c933812-975d-4284-92d3-2f64368fc6f8",
          name: "Abduction Upper Cuts w/FR",
        },
        {
          id: "18e4a2d6-740d-4df1-add9-68e13ee1cdc6",
          name: "Lock 3",
        },
      ],
      title: "Exercises (157)",
    },
  },
]
const testWorkouts: Workouts = [
  {
    id: "4e8b7a81-44f4-4bde-a985-465b77dbfba4",
    program_order: 0,
    program_id: "cf0ac9d8-7462-4ab5-92dc-7429133c10be",
    name: "workout 1",
    blocks: [
      {
        type: "exercise",
        exercise: {
          id: "516e0990-972e-496d-b4d1-4950d4c54451",
          name: "Leg Extensions",
          metadata: {
            sets: "3",
            reps: "12",
            weight: "100",
            rest: "30s",
          },
        },
        pendingStatus: {
          type: "adding",
          proposalId: "7c6340ba-b3a5-4665-bf61-d3e341e14fc8",
        },
      },
      {
        type: "exercise",
        exercise: {
          id: "43338045-a2de-4f4a-b0f8-4f2d0c50eeaf",
          name: "Split Squats",
          metadata: {
            sets: "3",
            reps: "12",
            weight: "100",
            rest: "30s",
          },
        },
        pendingStatus: {
          type: "updating",
          oldBlock: {
            type: "exercise",
            exercise: {
              id: "381facbb-912c-4212-9842-9d173be77fd0",
              name: "Double Leg Calf Raise w/Step",
              metadata: {
                sets: "3",
                reps: "12",
                weight: "100",
                rest: "30s",
              },
            },
          },
          proposalId: "a91db429-eeac-4532-881f-d8ee18caf2b7",
        },
      },
      {
        type: "exercise",
        exercise: {
          id: "5fdd9135-cd45-4695-8968-b62a0f34c757",
          name: "Single Leg Calf Raise w/Step",
          metadata: {
            sets: "3",
            reps: "12",
            weight: "100",
            rest: "30s",
          },
        },
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
            notes: "Circuit 1 notes",
          },
          exercises: [
            {
              type: "exercise",
              exercise: {
                id: "b4711ec3-d3b5-43ef-a2bd-a29d6bfd4caa",
                name: "Calf Raises w/Knees Bent",
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
                id: "149beb8e-245b-434e-81e9-f53507bf2381",
                name: "Heel Elevated Squats",
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
        pendingStatus: {
          type: "removing",
          proposalId: "2cbd9722-99b5-44f4-895a-608e1d2fced9",
        },
      },
      {
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
                id: "516e0990-972e-496d-b4d1-4950d4c54451",
                name: "Leg Extensions",
                metadata: {
                  sets: "3",
                  reps: "12",
                  weight: "100",
                  rest: "30s",
                },
              },
              pendingStatus: {
                type: "adding",
                proposalId: "8c4b7d26-a0e9-45b8-bf6c-aac67e214692",
              },
            },
            {
              type: "exercise",
              exercise: {
                id: "fdd06654-a295-4b72-a2fb-b1585fcb3dc5",
                name: "Reverse Lunges",
                metadata: {
                  sets: "3",
                  reps: "12",
                  weight: "100",
                  rest: "30s",
                },
              },
              pendingStatus: {
                type: "removing",
                proposalId: "6db590c6-29ab-48ef-8f32-77bb4a7e0be6",
              },
            },
            {
              type: "exercise",
              exercise: {
                id: "43338045-a2de-4f4a-b0f8-4f2d0c50eeaf",
                name: "Split Squats",
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
      },
    ],
  },
]

export { testExercises, testWorkouts }
