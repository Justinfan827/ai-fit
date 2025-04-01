import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Exercise, exercisesSchema } from '@/lib/domain/workouts'
import { ExerciseSelectionDialog } from './ExerciseSelectionDialog'

const ProgramParametersFormSchema = z
  .object({
    lengthOfWorkout: z.string(),
    lengthOfProgram: z.string(),
    daysPerWeek: z.string(),
    preferredExercises: exercisesSchema,
    otherNotes: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.lengthOfProgram === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Please enter the length of the program`,
      })
      return
    }
    const lengthOfProgram = parseInt(data.lengthOfProgram)
    if (isNaN(lengthOfProgram)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Please enter a valid number for the length of the program`,
      })
      return
    }
    if (lengthOfProgram < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Please enter a positive number for the length of the program`,
      })
      return
    }

    if (data.lengthOfWorkout === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Please enter the length of the workout`,
      })
      return
    }
    const lengthOfWorkout = parseInt(data.lengthOfWorkout)
    if (isNaN(lengthOfWorkout)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Please enter a valid number for the length of the workout`,
        path: ['lengthOfWorkout'],
      })
      return
    }
    // must be a positive number
    // max length of workout is 2 hours
    if (lengthOfWorkout < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Please enter a positive number for the length of the workout`,
        path: ['lengthOfWorkout'],
      })
      return
    }
    if (lengthOfWorkout > 120) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Please enter a number less than 120 minutes for the length of the workout`,
        path: ['lengthOfWorkout'],
      })
      return
    }

    if (data.daysPerWeek === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Please enter the number of days per week`,
        path: ['daysPerWeek'],
      })
      return
    }
    const daysPerWeek = parseInt(data.daysPerWeek)
    if (isNaN(daysPerWeek)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Please enter a valid number for the number of days per week`,
        path: ['daysPerWeek'],
      })
      return
    }
    if (daysPerWeek < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Please enter a positive number for the number of days per week`,
        path: ['daysPerWeek'],
      })
      return
    }
    if (daysPerWeek > 7) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Please enter a number less than 7 for the number of days per week`,
        path: ['daysPerWeek'],
      })
      return
    }
  })

export type ProgramParametersFormType = z.infer<
  typeof ProgramParametersFormSchema
>

export function ProgramParametersForm({
  onSubmit,
  formName,
  exercises: serverExercises,
}: {
  formName: string
  onSubmit: (data: ProgramParametersFormType) => void
  exercises: Exercise[]
}) {
  const form = useForm<ProgramParametersFormType>({
    resolver: zodResolver(ProgramParametersFormSchema),
    defaultValues: {
      lengthOfWorkout: '30',
      daysPerWeek: '3',
      lengthOfProgram: '12',
      otherNotes: '',
      preferredExercises: serverExercises,
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        id={formName}
      >
        <FormField
          control={form.control}
          name="lengthOfWorkout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workout length</FormLabel>
              <FormControl>
                <Input min="0" type="number" placeholder="" {...field} />
              </FormControl>
              <FormDescription>
                How long should workouts be (in minutes)?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="daysPerWeek"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Days per week</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="7"
                  placeholder=""
                  {...field}
                />
              </FormControl>
              <FormDescription>
                How many days per week will the client be working out?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lengthOfProgram"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Program Length</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="52"
                  placeholder=""
                  {...field}
                />
              </FormControl>
              <FormDescription>
                How many weeks should the program be?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="preferredExercises"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exercise Preferences</FormLabel>
              <FormControl>
                <div>
                  {/* TODO: let users edit exercises that will get included in the generated */}
                  <ExerciseSelectionDialog
                    exercises={field.value}
                    setExercises={(exercises) => {
                      form.setValue('preferredExercises', exercises)
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Choose the exercises you want to include in the program.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="otherNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Program Details</FormLabel>
              <FormControl>
                <Textarea placeholder="" className="" {...field} />
              </FormControl>
              <FormDescription>
                Be as detailed as you want! More information helps us help you
                create a better workout plan.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
