import { IntakeForm } from '@/components/forms/intake-form'
import { Icons } from '@/components/icons'
import { Typography } from '@/components/typography'
import WorkoutPlanProvider from '@/hooks/use-workout'

export default function Home() {
  return (
    <WorkoutPlanProvider>
      <div className="debug mx-auto w-full max-w-[1000px] flex-row items-center justify-center px-20">
        <div className="w-full flex-row items-center justify-center space-y-4">
          <Typography variant="display">AI Strong</Typography>
          <Typography variant="displaySubtitle">
            Workout smarter with an AI generated workout plan
          </Typography>
          <div className="flex w-full justify-center">
            <Icons.chevronDown className="h-15 w-15 animate-bounce" />
          </div>
        </div>
        <IntakeForm />
      </div>
    </WorkoutPlanProvider>
  )
}
