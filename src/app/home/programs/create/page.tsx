'use client'
import WorkoutPlanEditor from '@/components/grid/workout-plan-editor'
import WorkoutPlanProvider from '@/hooks/use-workout'

export default function Page() {
  return (
    <WorkoutPlanProvider>
      {/* <ResizablePanelGroup */}
      {/*   direction="horizontal" */}
      {/*   className="min-h-[200px] rounded-lg border" */}
      {/* > */}
      {/*   <ResizablePanel defaultSize={10}> */}
      {/*     <div className="flex h-full flex-col items-start justify-start space-y-2 p-6"> */}
      {/*       <span className="font-semibold">Input</span> */}
      {/*       <Separator /> */}
      {/*       <ClientSideForm /> */}
      {/*     </div> */}
      {/*   </ResizablePanel> */}
      {/*   <ResizableHandle withHandle /> */}
      {/*   <ResizablePanel defaultSize={90}> */}
      {/*   </ResizablePanel> */}
      {/* </ResizablePanelGroup> */}
      <WorkoutPlanEditor />
    </WorkoutPlanProvider>
  )
}
