'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
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
import apiGenerateProgram from '@/fetches/generate-program'
import { useAIProgram } from '@/hooks/use-workout'
import { toast } from 'sonner'
import { Icons } from '../icons'
import { Checkbox } from '../ui/checkbox'
import { Textarea } from '../ui/textarea'

const FormSchema = z.object({
  firstname: z.string().min(1, {
    message: 'first name must be at least 1 characters.',
  }),
  lastname: z.string().min(1, {
    message: 'last name must be at least 1 characters.',
  }),
  age: z.string(),
  goals: z.array(z.string()).min(1, {
    message: 'please select at least one goal.',
  }),
  experience: z.string().min(1, {
    message: 'please select an experience level.',
  }),
  lengthOfWorkout: z.string().min(1, {
    message: 'please select a length of workout.',
  }),
  daysPerWeek: z.string(),
  typeOfWorkoutPreference: z
    .array(z.string())
    .min(1, {
      message: 'please select at least one workout type.',
    })
    .optional(),
  otherDetails: z.string().optional(),
})

const possibleGoals = [
  {
    id: 'lose-weight',
    label: 'Lose Weight',
  },
  {
    id: 'build-muscle',
    label: 'Build Muscle',
  },
  {
    id: 'improve-general-fitness',
    label: 'Improve General Fitness',
  },
  {
    id: 'increase-strength',
    label: 'Increase Strength',
  },
  {
    id: 'improve-endurance',
    label: 'Improve Endurance',
  },
]

const experienceLevel = [
  {
    id: 'newbie',
    label: 'Newbie',
  },
  {
    id: 'beginner',
    label: 'Beginner',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
  },
  {
    id: 'advanced',
    label: 'Advanced',
  },
]

const lengthOfWorkout = [
  {
    id: '30-minutes-max',
    label: '30 minutes max',
  },
  {
    id: '45-minutes-max',
    label: '45 minutes max',
  },
  {
    id: '60-minutes-max',
    label: '60 minutes max',
  },
]

// Read a quick primer on the types of workouts before your selection:
// CrossFit: A type of high-intensity workout that combines weightlifting, gymnastics, and cardio exercises to build overall fitness.
//
// Functional Bodybuilding: A style of training that combines traditional bodybuilding exercises with functional movements. The focus is on building muscle and strength while also improving mobility and movement patterns. Look good + feel good.
//
// Bodybuilding: Training focussed on building muscle mass and definition. Compound movements + isolation movements for specific muscle groups. Typically in the 8-12 rep range.
//
// HIIT (High-Intensity Interval Training): Alternating between periods of intense exercise and periods of rest or low-intensity activity. HIIT workouts are designed to be challenging and time efficient. Taxing on the central nervous system.
//
// Long Form Cardio: Also known as steady-state cardio, involves doing aerobic exercise at a steady, moderate intensity for an extended period of time, typically 30 minutes or more. E.g.  running, cycling, or using an elliptical machine.
//
// General Strength Training: Lifting weights or performing bodyweight exercises to improve overall strength and fitness. These workouts can include a variety of exercises. (Good for beginners)
//
// Powerlifting: Training to focus on three main lifts: the squat, bench press, and deadlift. The goal is to lift as much weight as possible in these lifts. (Not beginner friendly)
//

const typeOfWorkoutPreference = [
  {
    id: 'crossfit',
    label: 'CrossFit',
  },
  {
    id: 'functional-bodybuilding',
    label: 'Functional Bodybuilding',
  },
  {
    id: 'bodybuilding',
    label: 'Bodybuilding',
  },
  {
    id: 'hiit',
    label: 'HIIT',
  },
  {
    id: 'long-form-cardio',
    label: 'Long Form Cardio',
  },
  {
    id: 'general-strength-training',
    label: 'General Strength Training',
  },
  {
    id: 'powerlifting',
    label: 'Powerlifting',
  },
]

export function IntakeForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      firstname: 'Vinson',
      lastname: 'Li',
      age: '22',
      goals: ['increase-strength'],
      experience: 'intermediate',
      lengthOfWorkout: '30-minutes-max',
      daysPerWeek: '3',
      typeOfWorkoutPreference: [
        'general-strength-training',
        'bodybuilding',
        'functional-bodybuilding',
      ],
      otherDetails:
        'Vinson is a 22 year old guy who is pretty fit. He has some trouble squatting so we need to regress that movement into a loaded leg press or single leg variations. He just wants to get really strong.',
    },
  })
  const { setProgram: setProgram, isPending, setIsPending } = useAIProgram()

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    // TODO: when i submit this form, should I use an
    // AI to generate the prompt I use for the workout generation?
    toast('You submitted', {
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })

    const prompt = formToPrompt(data)
    toast('Prompt', {
      description: prompt,
    })
    setIsPending(true)
    const { data: apiData, error } = await apiGenerateProgram({
      clientInfo: prompt,
      totalNumDays: Number(data.daysPerWeek),
    })
    if (error) {
      setIsPending(false)
      toast('Error', {
        description: error.message,
      })
      return
    }
    console.log({ apiData })
    setProgram(apiData)
    setIsPending(false)
  }

  const formToPrompt = (data: z.infer<typeof FormSchema>) => {
    return `Generate a workout plan for ${data.firstname} ${data.lastname}, a ${data.age} year old ${
      experienceLevel.find((exp) => exp.id === data.experience)?.label
    } looking to ${data.goals.map((goal) =>
      possibleGoals.find((g) => g.id === goal)?.label.toLowerCase()
    )}. They prefer ${typeOfWorkoutPreference
      .filter((type) => data.typeOfWorkoutPreference?.includes(type.id))
      .map((type) => type.label.toLowerCase())} workouts ${
      data.lengthOfWorkout === '30-minutes-max'
        ? 'that are 30 minutes or less'
        : data.lengthOfWorkout === '45-minutes-max'
          ? 'that are 45 minutes or less'
          : 'that are 60 minutes or less'
    } and want to workout ${
      data.daysPerWeek
    } days a week. ${data.otherDetails ? data.otherDetails : ''}`
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="firstname"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">First Name</FormLabel>
              <FormControl>
                <Input placeholder="John" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastname"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Wick" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">How old are you?</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="goals"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">
                  What are your training goals?
                </FormLabel>
                <FormDescription></FormDescription>
              </div>
              {possibleGoals.map((goal) => (
                <FormField
                  key={goal.id}
                  control={form.control}
                  name="goals"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={goal.id}
                        className="flex flex-row items-start space-y-0 space-x-3"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(goal.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, goal.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== goal.id
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {goal.label}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="experience"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">
                  What&apos;s your experience level?
                </FormLabel>
                <FormDescription></FormDescription>
              </div>
              {experienceLevel.map((expLevel) => (
                <FormField
                  key={expLevel.id}
                  control={form.control}
                  name="experience"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={expLevel.id}
                        className="flex flex-row items-start space-y-0 space-x-3"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value === expLevel.id}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange(expLevel.id)
                                : field.onChange('')
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {expLevel.label}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lengthOfWorkout"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">
                  Any preference for the length of workout?
                </FormLabel>
                <FormDescription>
                  How long do you want your workouts to be?
                </FormDescription>
              </div>
              {lengthOfWorkout.map((curLength) => (
                <FormField
                  key={curLength.id}
                  control={form.control}
                  name="lengthOfWorkout"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={curLength.id}
                        className="flex flex-row items-start space-y-0 space-x-3"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value === curLength.id}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange(curLength.id)
                                : field.onChange('')
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {curLength.label}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="daysPerWeek"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                How many days a week do you want to workout?
              </FormLabel>
              <FormDescription>
                We recommend 3-5 days a week for most people!
              </FormDescription>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="typeOfWorkoutPreference"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">
                  What are your training goals?
                </FormLabel>
                <FormDescription></FormDescription>
              </div>
              {typeOfWorkoutPreference.map((typeOfWorkout) => (
                <FormField
                  key={typeOfWorkout.id}
                  control={form.control}
                  name="typeOfWorkoutPreference"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={typeOfWorkout.id}
                        className="flex flex-row items-start space-y-0 space-x-3"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(typeOfWorkout.id)}
                            onCheckedChange={(checked) => {
                              const existingValues = field.value || []
                              return checked
                                ? field.onChange([
                                    ...existingValues,
                                    typeOfWorkout.id,
                                  ])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== typeOfWorkout.id
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {typeOfWorkout.label}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="otherDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">
                Any other details you want to share?
              </FormLabel>
              <FormControl>
                <Textarea placeholder="" className="resize-none" {...field} />
              </FormControl>
              <FormDescription>
                Be as detailed as you want! More information helps us help you
                create a better workout plan.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={isPending} type="submit">
          Generate Workout
          <Icons.sparkles className="h-5 w-5" />
        </Button>
      </form>
    </Form>
  )
}
