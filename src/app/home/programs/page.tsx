import { getUserPrograms } from '@/lib/supabase/server/database.operations.queries'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default async function WorkoutsPage() {
  const { data, error } = await getUserPrograms()
  if (error) {
    return <div>error: {error.message}</div>
  }
  return (
    <div className="mx-auto max-w-7xl">
      <div id="list-container" className="mt-8">
        {data.map((program, idx) => (
          <div
            key={program.id}
            className={cn(
              'flex border-x border-b border-neutral-700 px-4 py-4',
              idx === 0 && 'rounded-t-sm border-t',
              idx === data.length - 1 && 'rounded-b-sm border-b'
            )}
          >
            <Link href={`/home/programs/${program.id}`}>{program.name}</Link>
          </div>
        ))}
      </div>
    </div>
  )
  // return (
  //   <WorkoutPlanProvider>
  //     <div className="mx-auto w-full max-w-[1000px] flex-row items-center justify-center px-20">
  //       <div className="w-full flex-row items-center justify-center space-y-4">
  //         <Typography variant="display">AI Strong</Typography>
  //         <Typography variant="displaySubtitle">
  //           Workout smarter with an AI generated workout plan
  //         </Typography>
  //         <div className="flex w-full justify-center">
  //           <Icons.chevronDown className="h-15 w-15 animate-bounce" />
  //         </div>
  //       </div>
  //       <IntakeForm />
  //     </div>
  //   </WorkoutPlanProvider>
  // )
}
