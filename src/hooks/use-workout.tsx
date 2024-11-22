"use client";

import { Workout } from "@/lib/ai/openai/schema";
import { createContext, useContext, useState } from "react";

interface WorkoutContext {
  workout: Workout | undefined;
  setWorkout: (p: Workout) => void;
}
const Context = createContext<WorkoutContext | undefined>(undefined);

interface TableProviderProps {
  children: React.ReactNode;
}

export default function WorkoutProvider({ children }: TableProviderProps) {
  const [workout, setWorkout] = useState<Workout | undefined>(undefined);
  return (
    <Context.Provider
      value={{
        workout,
        setWorkout,
      }}
    >
      <>{children}</>
    </Context.Provider>
  );
}

export const useWorkout = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useWorkout() must be used inside TableProvider");
  }
  return context;
};

