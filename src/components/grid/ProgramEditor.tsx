"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import EditableTypography from "@/components/EditableTypeography"
import { defaultBlocks, defaultColumns } from "@/components/grid/columns"
import { Icons } from "@/components/icons"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import apiCreateProgram from "@/fetches/create-program"
import apiEditProgram from "@/fetches/edit-program"
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
import PlusButton from "../buttons/PlusButton"
import LoadingButton from "../loading-button"
import { ProposedChangesMenu } from "../proposed-changes-menu"
import { Badge } from "../ui/badge"
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
  const { setProgramName, setWorkouts, setProposedChanges } =
    useZEditorActions()
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
          name: `workout ${workouts.length + 1}`,
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
    const { data, error } = await apiCreateProgram({
      body: {
        type: programType,
        id: uuidv4().toString(),
        created_at: new Date().toISOString(),
        name: programName,
        workouts,
      },
    })
    setIsPending(false)
    if (error) {
      toast("Error creating workout")
      return
    }
    router.push(`/home/programs/${data.id}`)
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
    const { error } = await apiEditProgram({ body: domainProgram })
    if (error) {
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
  return (
    <div className="w-full">
      <PageHeader
        actions={headerActions}
        title={
          <EditableTypography
            className="text-2xl"
            onChange={setProgramName}
            value={programName}
          />
        }
      />
      <div className="overflow-x-auto p-4">
        <div className="flex gap-8">
          {workoutsByWeek.map((weeksWorkouts, weekIdx) => {
            return (
              <div
                className="min-w-[1200px] pr-4"
                id="workout-ui"
                key={`by-week-workout-${weekIdx}`}
              >
                <div className="gap-4">
                  <div className="ml-16 flex items-center justify-between gap-4 pr-[52px] pb-3">
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
                  <div className="w-full grow space-y-8" id="workouts-data">
                    {weeksWorkouts.map((workout, workoutIdx) => {
                      return (
                        <div className="flex gap-4" key={workout.id}>
                          <div className="grow space-y-4">
                            <div className="ml-[72px] flex items-center justify-between">
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
                                id="action menu"
                              >
                                {workoutIdx === 0 && weekIdx === 0 ? null : (
                                  <Button
                                    className="h-6 w-6 text-accent-foreground opacity-50 transition-opacity ease-in-out hover:opacity-100"
                                    onClick={() => handleDeletion(workout.id)}
                                    size="icon"
                                    variant="ghost"
                                  >
                                    <Icons.x className="h-4 w-4" />
                                  </Button>
                                )}
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
                </div>
                <div className="flex w-full items-center justify-end pt-4">
                  <PlusButton
                    onClick={() => addNewWorkoutToWeek({ week: weekIdx })}
                    text="Add Workout"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <ProposedChangesMenu />
    </div>
  )
}
