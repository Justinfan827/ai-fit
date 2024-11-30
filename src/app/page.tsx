"use client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import WorkoutPlanProvider from "@/hooks/use-workout";
import ClientSideForm from "./client-side-form";
import ClientSideResults from "./client-side-results";

export default function Page() {
  return (
    <WorkoutPlanProvider>
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[200px] rounded-lg border"
      >
        <ResizablePanel defaultSize={10}>
          <div className="flex h-full flex-col items-start justify-start p-6 space-y-2">
            <span className="font-semibold">Input</span>
            <Separator />
            {/* <ClientSide /> */}
            <ClientSideForm />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={90}>
          <ClientSideResults />
        </ResizablePanel>
      </ResizablePanelGroup>
    </WorkoutPlanProvider>
  );
}
