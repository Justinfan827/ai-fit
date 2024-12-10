import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Workout } from '@/lib/domain/workouts'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const WorkoutInstanceFormSchema = z.object({
  exercises: z.array(
    z.object({
      sets: z.array(
        z.object({
          reps: z.string(),
          weight: z.string(),
          rest: z.string(),
          notes: z.string(),
        })
      ),
    })
  ),
})

export function WorkoutAccordion({ workout }: { workout: Workout }) {
  const form = useForm<WorkoutInstanceFormType>({
    resolver: zodResolver(WorkoutInstanceFormSchema),
    defaultValues: {
      exercises: workout.rows.map((exercise) => {
        return {
          sets: Array.from({ length: Number(exercise.sets) }).map(() => ({
            reps: '',
            weight: '',
            rest: exercise.rest,
            notes: '',
          })),
        }
      }),
    },
  })
  const onSubmit = (data: WorkoutInstanceFormType) => {
    console.log(data)
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Accordion type="multiple" className="w-full">
          {workout.rows.map((exercise, index) => (
            <AccordionItem
              key={exercise.exercise_name}
              value={exercise.exercise_name}
            >
              <AccordionTrigger>
                <div
                  key={index}
                  className="flex items-center justify-start space-x-3"
                >
                  <div className="h-10 w-10 rounded-sm border border-neutral-700 p-2 text-center font-mono">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-lg font-semibold">
                      {exercise.exercise_name}
                    </p>
                    <p className="font-mono tracking-wider">
                      {exercise.sets}x{exercise.reps} @ {exercise.weight}lb
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <SetsContent
                  exerciseIdx={index}
                  form={form}
                  exercise={exercise}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </form>
    </Form>
  )
}

type WorkoutInstanceFormType = z.infer<typeof WorkoutInstanceFormSchema>
function SetsContent({
  exerciseIdx,
  exercise,
  form,
}: {
  exercise: Workout['rows'][0]
  exerciseIdx: number
  form: ReturnType<typeof useForm<WorkoutInstanceFormType>>
}) {
  const numSets = Number(exercise.sets)
  const inputFields = [
    {
      label: 'reps',
      value: exercise.reps,
    },
    {
      label: 'weight',
      value: exercise.weight,
    },
    {
      label: 'rest',
      value: exercise.rest,
    },
  ]
  return (
    <div className="w-full flex-col justify-center space-y-2 py-2">
      {Array.from({ length: numSets }).map((_, index) => {
        const setFields = form.watch(`exercises.${exerciseIdx}.sets.${index}`)
        const completed = Object.values({
          reps: setFields.reps,
          weight: setFields.weight,
          rest: setFields.rest,
        }).every((field) => field !== '')
        return (
          <div key={index} className="flex items-end justify-start gap-8">
            <div
              className={cn(
                'h-10 w-10 rounded-full border border-neutral-700 p-2 text-center font-mono transition-colors delay-75 ease-in-out',
                completed && 'border-green-900'
              )}
            >
              {index + 1}
            </div>
            {inputFields.map(({ label, value }) => {
              return (
                <FormField
                  key={`${exerciseIdx}-${index}-${label}`}
                  control={form.control}
                  name={`exercises.${exerciseIdx}.sets.${index}.${label as keyof WorkoutInstanceFormType['exercises'][0]['sets'][0]}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div
                          key={label}
                          className="w-[60px] flex-col items-center justify-center space-y-1 text-center"
                        >
                          <FormLabel className="text-lg font-semibold">
                            {label}
                          </FormLabel>
                          <Input
                            type="number"
                            inputMode="numeric"
                            placeholder={`${value}`}
                            className={cn(
                              'h-10 w-[60px] transition-colors delay-100 ease-in-out [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                              completed && 'border-green-900'
                            )}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
