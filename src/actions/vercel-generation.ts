// export default async function vercelGenerate({ prompt }: { prompt: string }) {
//   try {
//     const {
//       object: program,
//       request,
//       response,
//       usage,
//     } = await generateObject({
//       model: openai('gpt-4o-mini'),
//       schema: generateProgramSchema,
//       prompt,
//       system: systemPromptv1,
//     })

//     await sendDebugLog({
//       request: {
//         request: JSON.stringify(request.body),
//         usage,
//       },
//       response,
//     })

//     console.log('\n\n\n')
//     console.log('SUCCESS GENERATING STRUCTURED OBJECT')
//     console.log('\n\n\n')
//     console.log('\n\n\n')
//     console.log('request made:')
//     console.log('\n\n\n')
//     console.log(request.body)
//     console.log('\n\n\n')
//     console.log('token usage')
//     console.log('\n\n\n')
//     console.log(usage)

//     const repo = new TrainerClientRepo()
//     // validate exercise choices!
//     const { data: exercises, error: exercisesError } =
//       await repo.getAllExercises()

//     // validate ai generated exercises are in the input list
//     return {
//       data: program,
//       error: null,
//     }
//   } catch (error) {
//     if (NoObjectGeneratedError.isInstance(error)) {
//       await sendDebugLog({
//         request: { usage: error.usage },
//         response: {
//           text: error.text,
//           error: error,
//         },
//       })

//       console.log('\n\n\n')
//       console.log('ERROR GENERATING STRUCTURED OBJECT')
//       console.log('response from model')
//       console.log('\n\n\n')
//       console.log(error.text)
//       console.log('\n\n\n')
//       console.log('token usage')
//       console.log('\n\n\n')
//       console.log(error.usage)
//       console.log('error!')
//       console.log(error)
//       return {
//         data: null,
//         error,
//       }
//     }
//     return {
//       data: null,
//       error,
//     }
//   }
// }
