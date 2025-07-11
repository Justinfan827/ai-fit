import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type {
  ExerciseInstance,
  Workout,
  WorkoutExercise,
  WorkoutInstance,
} from "@/lib/domain/workouts"
import { cn } from "@/lib/utils"
import type { WorkoutForm } from "./form"

export function WorkoutAccordion({
  workout,
  form,
}: {
  workout: Workout
  form: WorkoutForm
}) {
  return (
    // <Form {...form}>
    //   <form id="workout-form" className="space-y-6">
    //     <Accordion type="multiple" className="w-full">
    //       {workout.blocks.map((exercise, index) => (
    //         <AccordionItem
    //           key={exercise.exercise_name}
    //           value={exercise.exercise_name}
    //         >
    //           <AccordionTrigger>
    //             <div
    //               key={index}
    //               className="flex items-center justify-start space-x-3"
    //             >
    //               <div className="h-10 w-10 rounded-sm border border-neutral-700 p-2 text-center font-mono">
    //                 {index + 1}
    //               </div>
    //               <div>
    //                 <p className="text-lg font-semibold">
    //                   {exercise.exercise_name}
    //                 </p>
    //                 <p className="font-mono tracking-wider">
    //                   {exercise.sets}x{exercise.reps} @ {exercise.weight}lb
    //                 </p>
    //               </div>
    //             </div>
    //           </AccordionTrigger>
    //           <AccordionContent>
    //             <SetsContent
    //               exerciseIdx={index}
    //               form={form}
    //               exercise={exercise}
    //             />
    //           </AccordionContent>
    //         </AccordionItem>
    //       ))}
    //     </Accordion>
    //   </form>
    // </Form>
    <div />
  )
}

function SetsContent({
  exerciseIdx,
  exercise,
  form,
}: {
  exercise: WorkoutExercise
  exerciseIdx: number
  form: WorkoutForm
}) {
  const numSets = Number(exercise.sets)
  const inputFields = [
    {
      label: "reps" as const,
      value: exercise.reps,
    },
    {
      label: "weight" as const,
      value: exercise.weight,
    },
    {
      label: "rest" as const,
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
        }).every((field) => field !== "")
        return (
          <div className="flex items-end justify-start gap-8" key={index}>
            <div
              className={cn(
                "h-10 w-10 rounded-full border border-neutral-700 p-2 text-center font-mono transition-colors delay-75 ease-in-out",
                completed && "border-green-900"
              )}
            >
              {index + 1}
            </div>
            {inputFields.map(({ label, value }) => {
              return (
                <FormField
                  control={form.control}
                  key={`${exerciseIdx}-${index}-${label}`}
                  name={`exercises.${exerciseIdx}.sets.${index}.${label}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div
                          className="w-[60px] flex-col items-center justify-center space-y-1 text-center"
                          key={label}
                        >
                          <FormLabel className="font-semibold text-lg">
                            {label}
                          </FormLabel>
                          <Input
                            className={cn(
                              "h-10 w-[60px] transition-colors delay-100 ease-in-out [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                              completed && "border-green-900"
                            )}
                            inputMode="numeric"
                            placeholder={`${value}`}
                            type="number"
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

export function WorkoutAccordionInstance({
  workoutInstance,
  form,
}: {
  workoutInstance: WorkoutInstance
  form: WorkoutForm
}) {
  return (
    <Form {...form}>
      <form className="space-y-6" id="workout-form">
        <Accordion className="w-full" type="multiple">
          {workoutInstance.blocks.map((block, index) => (
            <AccordionItem
              key={block.exercise.name}
              value={block.exercise.name}
            >
              <AccordionTrigger>
                <div
                  className="flex items-center justify-start space-x-3"
                  key={index}
                >
                  <div className="h-10 w-10 rounded-sm border border-neutral-700 p-2 text-center font-mono">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      {block.exercise.name}
                    </p>
                    <p className="tracking-wider">
                      {block.exercise.sets.length} sets
                    </p>
                    <p className="font-mono">
                      {block.exercise.sets
                        .map((set) => {
                          return `${set.planned.reps}x${set.planned.weight}lb`
                        })
                        .join(", ")}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <SetsContentInstance
                  exercise={block.exercise}
                  exerciseIdx={index}
                  form={form}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </form>
    </Form>
  )
}

function SetsContentInstance({
  exerciseIdx,
  exercise,
  form,
}: {
  exercise: ExerciseInstance
  exerciseIdx: number
  form: WorkoutForm
}) {
  const inputFields = [
    {
      label: "reps" as const,
    },
    {
      label: "weight" as const,
    },
    {
      label: "rest" as const,
    },
  ]
  return (
    <div className="w-full flex-col justify-center space-y-2 py-2">
      {exercise.sets.map((set, index) => {
        const setFields = form.watch(`exercises.${exerciseIdx}.sets.${index}`)
        const completed = Object.values({
          reps: setFields.reps,
          weight: setFields.weight,
          rest: setFields.rest,
        }).every((field) => field !== "")
        return (
          <div className="flex items-end justify-start gap-8" key={index}>
            <div
              className={cn(
                "h-10 w-10 rounded-full border border-neutral-700 p-2 text-center font-mono transition-colors delay-75 ease-in-out",
                completed && "border-green-900"
              )}
            >
              {index + 1}
            </div>
            {inputFields.map(({ label }) => {
              return (
                <FormField
                  control={form.control}
                  key={`${exerciseIdx}-${index}-${label}`}
                  name={`exercises.${exerciseIdx}.sets.${index}.${label}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div
                          className="w-[60px] flex-col items-center justify-center space-y-1 text-center"
                          key={label}
                        >
                          <FormLabel className="font-semibold text-lg">
                            {label}
                          </FormLabel>
                          <Input
                            className={cn(
                              "h-10 w-[60px] transition-colors delay-100 ease-in-out [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                              completed && "border-green-900"
                            )}
                            inputMode="numeric"
                            placeholder={`${set.planned[label]}`}
                            type="number"
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
