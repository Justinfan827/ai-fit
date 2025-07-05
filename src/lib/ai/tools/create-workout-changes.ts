import { Workouts } from '@/lib/domain/workouts'
import {
  CoreMessage,
  DataStreamWriter,
  generateText,
  streamObject,
  tool,
} from 'ai'
import { z } from 'zod'
import {
  buildDiffGenerationPrompt,
  buildWorkoutModificationPrompt,
  ContextItem,
} from '../prompts/prompts'
import { myProvider } from '../providers'
import { workoutChangeSchema } from './diff-schema'

interface CreateWorkoutChangesProps {
  messages: CoreMessage[]
  contextItems: ContextItem[]
  existingWorkouts: Workouts
  dataStream: DataStreamWriter
}

export const createWorkoutChanges = ({
  existingWorkouts,
  contextItems,
  messages,
  dataStream,
}: CreateWorkoutChangesProps) => {
  return tool({
    description: 'Request updates to the existing workout program',
    parameters: z.object({}),
    execute: async () => {
      console.log('--------------------------------')
      console.log('Creating workout changes...')
      console.log('--------------------------------')
      const systemPrompt = buildWorkoutModificationPrompt(
        contextItems,
        existingWorkouts
      )
      console.log('Workout changes system prompt:')
      console.log('--------------------------------')
      console.log(systemPrompt)
      console.log('--------------------------------')

      // TODO: collapse into one?
      const { text: updatedWorkoutText } = await generateText({
        model: myProvider.languageModel('chat-model'),
        system: systemPrompt,
        messages,
      })

      console.log('Updated workout text:')
      console.log('--------------------------------')
      console.log(updatedWorkoutText)
      console.log('--------------------------------')

      const diffGenerationSystemPrompt = buildDiffGenerationPrompt(
        existingWorkouts,
        updatedWorkoutText
      )
      const diffGenerationPrompt =
        'generate a workout diff for the following changes'

      console.log('Diff generation system prompt:')
      console.log('--------------------------------')
      console.log(diffGenerationSystemPrompt)
      console.log('--------------------------------')
      console.log('Diff generation prompt:')
      console.log('--------------------------------')
      console.log(diffGenerationPrompt)
      try {
        // Step 2: Convert text changes to structured diff
        const { elementStream } = streamObject({
          model: myProvider.languageModel('chat-model'),
          schema: workoutChangeSchema,
          output: 'array',
          system: diffGenerationSystemPrompt,
          prompt: diffGenerationPrompt,
        })
        console.log('Diff generation streaming.')

        for await (const element of elementStream) {
          console.log('Suggested diff:')
          console.log('--------------------------------')
          console.log(JSON.stringify(element, null, 2))
          console.log('--------------------------------')
          dataStream.writeData({
            type: 'workout-diff',
            content: element,
          })
        }
        console.log('--------------------------------')
        console.log('Finished elementStream iteration')
        console.log('--------------------------------')
        return (
          'Done creating workout changes. Updated workout text: ' +
          updatedWorkoutText
        )
      } catch (error) {
        console.log('Diff generation caught error:')
        console.log('--------------------------------')
        console.log(JSON.stringify(error, null, 2))
        console.log('--------------------------------')
      }
    },
  })
}
