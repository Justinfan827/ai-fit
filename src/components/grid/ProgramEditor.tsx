"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import { createProgramAction } from "@/actions/create-program"
import { updateProgramAction } from "@/actions/save-program"
import EditableTypography from "@/components/EditableTypeography"
import { defaultBlocks, defaultColumns } from "@/components/grid/columns"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  useZEditorActions,
  useZIsNewProgram,
  useZProgramCreatedAt,
  useZProgramId,
  useZProgramName,
  useZProgramType,
  useZProgramWorkouts,
  useZProposedChanges,
} from "@/hooks/zustand/program-editor-state"
import { type Program, programSchema } from "@/lib/domain/workouts"
import { cn } from "@/lib/utils"
import PlusButton from "../buttons/PlusButton"
import { EmptyStateCard } from "../empty-state"
import LoadingButton from "../loading-button"
import { ProposedChangesMenu } from "../proposed-changes-menu"
import { Badge } from "../ui/badge"
import { useSidebar } from "../ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import WorkoutGrid from "./WorkoutGrid"
import { groupWorkoutsByWeek } from "./workout-utils"

export default function ProgramEditor() {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const workouts = useZProgramWorkouts()
  const programType = useZProgramType()
  const programName = useZProgramName()
  const programCreatedAt = useZProgramCreatedAt()
  const programId = useZProgramId()
  const { setWorkouts, setProposedChanges } = useZEditorActions()
  const workoutsByWeek = groupWorkoutsByWeek(workouts)

  const proposedChanges = useZProposedChanges()
  const isNewProgram = useZIsNewProgram()

  // Handle proposal actions (accept/reject)
  const handleProposalAction = (
    proposalId: string,
    action: "accept" | "reject"
  ) => {
    if (action === "accept") {
      // Remove the accepted proposal from the list
      const updatedChanges = proposedChanges.filter(
        (change) => change.id !== proposalId
      )
      setProposedChanges(updatedChanges)
    } else if (action === "reject") {
      // Remove the rejected proposal from the list
      const updatedChanges = proposedChanges.filter(
        (change) => change.id !== proposalId
      )
      setProposedChanges(updatedChanges)
    }
  }

  const addNewWorkoutToWeek = ({ week }: { week?: number }) => {
    /*
     *  TODO: should i change the meaning of program order? I.e.
     *  week: 1
     *   program_order:0
     *   week:2
     *   program_order: 0
     *   two workouts have the same program order, but they are in different weeks.
     *
     *  For a split, the program order should not be duplicated.
     *
     *  If force deletion of anything after week 1 when you switch to a split,
     *  this should be fine! i just need to make sure when i fetch programs, i order by
     *  week, and then program_order, for weekly programs.
     *
     */
    if (week === undefined) {
      setWorkouts([
        ...workouts,
        {
          id: uuidv4().toString(),
          program_id: programId,
          name: `workout ${workouts.length + 2}`,
          program_order: workouts.length,
          week,
          blocks: defaultBlocks,
        },
      ])
      return
    }

    const workoutsInTheWeek = workoutsByWeek[week] || []
    setWorkouts([
      ...workouts,
      {
        id: uuidv4().toString(),
        program_id: programId,
        name: `Workout ${workoutsInTheWeek.length + 1}`,
        program_order: workoutsInTheWeek.length,
        week,
        blocks: defaultBlocks,
      },
    ])
  }

  const handleDeletion = (id: string) => {
    const newWorkouts = workouts.filter((w) => w.id !== id)
    setWorkouts(newWorkouts)
  }

  const handleOnCreate = async () => {
    setIsPending(true)
    const { data: createdProgram, error: createError } =
      await createProgramAction({
        type: programType,
        created_at: new Date().toISOString(),
        name: programName,
        workouts,
      })
    setIsPending(false)
    if (createError) {
      toast("Error creating workout")
      return
    }
    router.push(`/home/studio/${createdProgram.id}`)
    toast("Workout created")
  }

  const [error, setError] = useState(new Error())
  const domainProgram: Program = useMemo(
    () => ({
      id: programId,
      created_at: programCreatedAt,
      name: programName,
      type: programType,
      workouts,
    }),
    [programId, programCreatedAt, programName, programType, workouts]
  )
  useEffect(() => {
    const { error } = programSchema.safeParse(domainProgram)
    if (error) {
      // TODO: show error to user / highlight problematic fields!
      setError(error)
    } else {
      setError(new Error())
    }
  }, [domainProgram])

  const handleOnSave = async () => {
    setIsPending(true)
    const { error: updateError } = await updateProgramAction(domainProgram)
    if (updateError) {
      toast.error("Error", {
        description: `Oops! We couldn't save your workout.Please try again`,
      })
      setIsPending(false)
      return
    }
    toast.success("Success", {
      description: `${programName} saved`,
    })
    setIsPending(false)
    router.refresh()
  }

  // TODO: uncomment when we support weekly programs
  // const handleProgramSelect = (v: "weekly" | "splits") => {
  //   setProgramType(v)
  // }

  // handle duplicating the current week to the next week
  const handleDuplicateWeek = (weekIdx: number) => {
    const dupeWorkouts = workoutsByWeek[weekIdx].map((w) => {
      return {
        ...w,
        id: uuidv4().toString(),
        week: weekIdx + 1,
      }
    })
    setWorkouts([...workouts, ...dupeWorkouts])
  }

  // Create header actions for the PageHeader
  const headerActions = (
    <div className="flex items-center justify-center space-x-2">
      {/* TODO: uncomment when we support weekly programs */}
      {/* <ProgramSelect onValueChange={handleProgramSelect} value={programType} /> */}
      <LoadingButton
        className="w-20"
        isLoading={isPending}
        onClick={() => (isNewProgram ? handleOnCreate() : handleOnSave())}
        variant="outline"
      >
        {isNewProgram ? "Create" : "Save"}
      </LoadingButton>
    </div>
  )
  const { open } = useSidebar()
  return (
    <div className="px-1 pt-2">
      <div
        className={cn(
          "scrollbar scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent overflow-auto",
          !open && "h-[calc(100svh-var(--header-height)-4*var(--spacing))]",
          open &&
            "h-[calc(100svh-var(--header-height)-2*var(--inset-height)-4*var(--spacing))]"
        )}
      >
        <div className="flex gap-8">
          {workouts.length === 0 && (
            <div className="w-full p-4">
              <EmptyStateCard
                actionComponent={
                  <PlusButton
                    onClick={() => addNewWorkoutToWeek({ week: 0 })}
                    text="Add Workout"
                  />
                }
                subtitle="Add a workout to get started"
                title="No Workouts"
              />
            </div>
          )}
          {workoutsByWeek.map((weeksWorkouts, weekIdx) => {
            return (
              <div
                className="min-w-[1200px] space-y-4 pr-4 [--action-menu-padding:--spacing(18)]"
                id="program-ui"
                key={`by-week-workout-${weekIdx}`}
              >
                {/* TODO: support weekly programs */}
                <div
                  className="flex items-center justify-between gap-4 pr-[52px] pb-3"
                  id="program-ui-header"
                >
                  {programType === "weekly" && (
                    <Badge
                      className="font-light text-muted-foreground text-xs uppercase tracking-widest"
                      variant="outline"
                    >
                      Week {weekIdx + 1}
                    </Badge>
                  )}
                  {programType === "weekly" && (
                    <div className="flex items-center" id="action menu">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            className="h-8 w-8 text-accent-foreground/50 hover:text-accent-foreground"
                            onClick={() => handleDuplicateWeek(weekIdx)}
                            size="icon"
                            variant="ghost"
                          >
                            <Icons.copy className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Duplicate Week</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
                <div
                  className="w-full grow space-y-8"
                  id="program-grid-container"
                >
                  {weeksWorkouts.map((workout, workoutIdx) => {
                    return (
                      <div className="flex gap-4" key={workout.id}>
                        <div className="grow space-y-4">
                          <div
                            className="ml-[var(--action-menu-padding)] flex items-center justify-between"
                            id="workout-header"
                          >
                            <EditableTypography
                              onChange={(value) => {
                                const newWorkouts = workouts.map((w) => {
                                  if (w.id === workout.id) {
                                    return {
                                      ...w,
                                      name: value,
                                    }
                                  }
                                  return w
                                })
                                setWorkouts(newWorkouts)
                              }}
                              value={workout.name}
                            />
                            <div
                              className="flex items-center justify-center pl-2"
                              id="workout-action-bar"
                            >
                              <Button
                                className="h-6 w-6 text-accent-foreground opacity-50 transition-opacity ease-in-out hover:opacity-100"
                                onClick={() => handleDeletion(workout.id)}
                                size="icon"
                                variant="ghost"
                              >
                                <Icons.x className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <WorkoutGrid
                            columns={defaultColumns}
                            onProposalAction={handleProposalAction}
                            onWorkoutChange={(updatedWorkout) => {
                              // Update the workout in the workouts array
                              const updatedWorkouts = workouts.map((w) => {
                                if (w.id === workout.id) {
                                  return updatedWorkout
                                }
                                return w
                              })
                              setWorkouts(updatedWorkouts)
                            }}
                            workout={workout}
                          />
                        </div>
                        {programType === "weekly" && (
                          <div className="mt-[48px] flex flex-col items-stretch">
                            <Button
                              className="grow font-normal text-sm"
                              id="next-week-workout-btn"
                              onClick={() =>
                                addNewWorkoutToWeek({ week: weekIdx + 1 })
                              }
                              size="icon"
                              variant="dashed"
                            >
                              <Icons.plus className="h-4 w-4 rounded-full" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div
                  className="flex w-full items-center justify-start pt-4 pl-[var(--action-menu-padding)]"
                  id="program-ui-add-workout-button"
                >
                  <PlusButton
                    onClick={() => addNewWorkoutToWeek({ week: weekIdx })}
                    text="Add Workout"
                  />
                </div>
              </div>
            )
          })}
        </div>

        <ProposedChangesMenu />
      </div>
    </div>
  )
}
