"use client";

import { WorkoutPlan } from "@/lib/domain/exercises";
import { createContext, useContext, useState } from "react";

interface WorkoutPlanContext {
  workoutPlan: WorkoutPlan | undefined;
  setWorkoutPlan: (p: WorkoutPlan) => void;
  setIsPending: (p: boolean) => void;
  isPending: boolean;
}
const Context = createContext<WorkoutPlanContext | undefined>(undefined);

interface TableProviderProps {
  children: React.ReactNode;
}

export default function WorkoutPlanProvider({ children }: TableProviderProps) {
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | undefined>(
    undefined,
  );
  const [isPending, setIsPending] = useState(false);
  return (
    <Context.Provider
      value={{
        workoutPlan,
        setWorkoutPlan,
        isPending,
        setIsPending,
      }}
    >
      <>{children}</>
    </Context.Provider>
  );
}

export const useWorkoutPlan = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useWorkout() must be used inside WorkoutPlanProvider");
  }
  return context;
};
