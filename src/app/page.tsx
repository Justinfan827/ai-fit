"use client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import ClientSide from "./client-side";
import WorkoutProvider from "@/hooks/use-workout";
import ClientSideResults from "./client-side-results";

export default function Page() {
  return (
    <WorkoutProvider>
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[200px] rounded-lg border"
      >
        <ResizablePanel defaultSize={25}>
          <div className="flex h-full flex-col items-start justify-start p-6">
            <span className="font-semibold">Editor</span>
            <ClientSide />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          <ClientSideResults />
        </ResizablePanel>
      </ResizablePanelGroup>
    </WorkoutProvider>
  );
}
