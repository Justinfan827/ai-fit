"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWorkout } from "@/hooks/use-workout";
import { Workout } from "@/lib/ai/openai/schema";
import React, { useEffect, useRef, useState } from "react";
import { AgGridReact, CustomCellEditorProps } from "ag-grid-react"; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import { BasicTable } from "@/components/table";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import useDebouncedValue from "@/hooks/use-debounce";
import { Exercise } from "@/lib/domain/exercises";

function CustomEditorComp({
  value,
  onValueChange,
  eGridCell,
}: CustomCellEditorProps) {
  // on focus of the eGridCell, i want to focus on the input
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [eGridCell]);
  return (
    <input
      ref={ref}
      type="text"
      className="w-full px-[15px] focus:outline-none"
      value={value || ""}
      onChange={({ target: { value } }) =>
        onValueChange(value === "" ? null : value)
      }
    />
  );
}

function useExercises({ searchTerm }: { searchTerm: string }) {
  const debouncedTerm = useDebouncedValue(searchTerm, 150);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(undefined);
  // undefined to distinguish between no data yet vs. no results
  const [exercises, setExercises] = useState<Exercise[] | undefined>(undefined);

  // TODO: debounce the search term and signal cancel the previous request
  useEffect(() => {
    let ignore = false;
    const queryFn = async (query: string) => {
      setIsPending(true);
      try {
        const res = await fetch(`/api/exercises/search?query=${query}`);
        if (!res.ok) {
          throw new Error("Failed to fetch exercises: " + res.status);
        }
        const { data } = await res.json();
        console.log({ data });
        // ignore flag as per react docs
        if (!ignore) {
          setExercises(data);
          setError(undefined);
        }
      } catch (e) {
        if (!ignore) {
          setError(e);
          setError(undefined);
        }
      } finally {
        if (!ignore) {
          setIsPending(false);
        }
      }
    };
    queryFn(debouncedTerm);
    return () => {
      ignore = true;
    };
  }, [debouncedTerm]);
  return {
    isPending,
    error,
    exercises,
  };
}

function CustomEditorCompCommand({
  value,
  onValueChange,
  eGridCell,
}: CustomCellEditorProps) {
  // on focus of the eGridCell, i want to focus on the input
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [eGridCell]);

  const { isPending, exercises } = useExercises({
    searchTerm: value,
  });
  console.log("results", exercises, value, isPending);
  const handleOnChange = (e: string) => {
    onValueChange(e === "" ? null : e);
  };

  return (
    <Command>
      <CommandInput
        ref={ref}
        value={value || ""}
        onValueChange={handleOnChange}
      />
      <CommandList>
        {isPending && <CommandItem>Loading...</CommandItem>}
        {!isPending && exercises?.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        {exercises?.map((exercise) => {
          return <CommandItem key={exercise.id}>{exercise.name}</CommandItem>;
        })}
      </CommandList>
    </Command>
  );
}

function useWorkoutGrid(workout: Workout) {
  const exerciseMetadataCols = workout.columns.map((c) => {
    return {
      field: c.type,
      headerName: `${c.type} (${c.units})`,
      editable: true,
    };
  });
  const gridCols = [
    {
      field: "name",
      editable: true,
      headerName: "Name",
      cellEditor: CustomEditorCompCommand,
    },
    ...exerciseMetadataCols,
  ];
  const gridRows = workout.exercises.map((e) => {
    const baseRow = {
      name: e.exercise_name,
    };
    // zero out the dynamic column values

    exerciseMetadataCols.forEach((c) => {
      baseRow[c.field] = "";
    });

    // use a reduce here instead
    const row = e.metadata.reduce((acc, m) => {
      return {
        ...acc,
        [m.type]: m.value,
      };
    }, baseRow);
    return row;
  });
  // Row Data: The data to be displayed.
  const [rowData, setRowData] = useState(gridRows);
  // Column Definitions: Defines the columns to be displayed.
  const [colDefs, setColDefs] = useState(gridCols);

  return {
    rowData,
    colDefs,
    setRowData,
    setColDefs,
  };
}

function WorkoutGrid({ workout }: { workout: Workout }) {
  const { rowData, colDefs } = useWorkoutGrid(workout);
  return (
    <div className="ag-theme-quartz h-[500px] w-full">
      <AgGridReact rowData={rowData} columnDefs={colDefs} />
    </div>
  );
}

export default function ClientSideResults() {
  const { workout } = useWorkout();
  return (
    <div className="flex h-full flex-col items-start justify-start p-6">
      <span className="font-semibold">Results</span>
      <div>Generated workout will be displayed here</div>
      {workout && <WorkoutGrid workout={workout} />}
    </div>
  );
}
