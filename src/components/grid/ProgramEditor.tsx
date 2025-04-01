'use client'

import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import EditableTypography from '@/components/EditableTypeography'
import { defaultColumns, defaultRowData } from '@/components/grid/columns'
import { ProgramSelect } from '@/components/grid/ProgramSelect'
import { Icons } from '@/components/icons'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import apiCreateProgram from '@/fetches/create-program'
import apiEditProgram from '@/fetches/edit-program'
import { useAIProgram } from '@/hooks/use-workout'
import {
  usezEditorActions,
  usezIsNewProgram,
  usezProgramCreatedAt,
  usezProgramId,
  usezProgramName,
  usezProgramType,
  usezProgramWorkouts,
} from '@/hooks/zustand/program-editor'
import { Program, programSchema, Workout } from '@/lib/domain/workouts'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import PlusButton from '../buttons/PlusButton'
import LoadingButton from '../loading-button'
import { Badge } from '../ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import WorkoutGrid from './WorkoutGrid'

export default function ProgramEditor() {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const workouts = usezProgramWorkouts()
  const programType = usezProgramType()
  const programName = usezProgramName()
  const programCreatedAt = usezProgramCreatedAt()
  const programId = usezProgramId()
  const { setProgramType, setProgramName, setWorkouts } = usezEditorActions()
  const workoutsByWeek = workouts.reduce((acc, w) => {
    const week = w.week || 0
    if (!acc[week]) {
      acc[week] = []
    }
    acc[week].push(w)
    return acc
  }, [] as Workout[][])

  const isNewProgram = usezIsNewProgram()

  // update grid when ai program gets generated
  const { program, isPending: isAIGenPending } = useAIProgram()
  useEffect(() => {
    if (program) {
      const workouts: Workout[] = program.workouts.map((w, idx) => {
        return {
          ...w,
          id: uuidv4().toString(), // populated on create
          program_id: uuidv4().toString(), // populated on create
          program_order: idx,
          blocks: w.blocks.map((b) => {
            return {
              ...b,
              id: uuidv4().toString(),
            }
          }),
        }
      })
      setWorkouts(workouts)
    }
  }, [program])

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
     *  If i force deletion of anything after week 1 when you switch to a split,
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
          week: week,
          blocks: defaultRowData,
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
        name: `Week: ${week + 1} Workout ${workoutsInTheWeek.length + 1}`,
        program_order: workoutsInTheWeek.length,
        week: week,
        blocks: defaultRowData,
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
      toast('Error creating workout')
      return
    }
    router.push(`/home/programs/${data.id}`)
    toast('Workout created')
  }

  const [error, setError] = useState(new Error())
  const domainProgram: Program = {
    id: programId,
    created_at: programCreatedAt,
    name: programName,
    type: programType,
    workouts,
  }
  useEffect(() => {
    const { error } = programSchema.safeParse(domainProgram)
    if (error) {
      setError(error)
    } else {
      setError(new Error())
    }
  }, [programId, programCreatedAt, programName, programType, workouts])

  const handleOnSave = async () => {
    setIsPending(true)
    const { error } = await apiEditProgram({ body: domainProgram })
    if (error) {
      console.log({ error })
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Oops! We couldn't save your workout.Please try again`,
      })
      setIsPending(false)
      return
    }
    toast({
      variant: 'default',
      title: 'Success',
      description: <pre>{programName} saved</pre>,
    })
    setIsPending(false)
    router.refresh()
  }

  const handleSelect = (v: 'weekly' | 'splits') => {
    setProgramType(v)
  }

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
      <ProgramSelect value={programType} onValueChange={handleSelect} />
      <LoadingButton
        isLoading={isPending}
        className="w-20"
        variant="outline"
        onClick={() => (!isNewProgram ? handleOnSave() : handleOnCreate())}
      >
        {!isNewProgram ? 'Save' : 'Create'}
      </LoadingButton>
    </div>
  )

  return (
    <div className="w-full">
      <PageHeader
        title={
          <EditableTypography
            className="text-2xl"
            value={programName}
            onChange={setProgramName}
          />
        }
        actions={headerActions}
      />
      <div className="overflow-x-auto p-4">
        {isAIGenPending && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-neutral-950/10 pb-14 backdrop-blur-sm">
            <p className="animate-pulse font-light tracking-wide text-neutral-100">
              Generating program...
            </p>
            <div className="flex flex-col items-center justify-center gap-4">
              <Icons.spinner className="h-8 w-8 animate-spin text-neutral-50" />
            </div>
          </div>
        )}
        <div className="flex gap-8">
          {workoutsByWeek.map((weeksWorkouts, weekIdx) => {
            return (
              <div
                key={`by-week-workout-${weekIdx}`}
                id="workout-ui"
                className="min-w-[1200px] pr-4"
              >
                <div className="gap-4">
                  <div className="ml-16 flex items-center justify-between gap-4 pb-3 pr-[52px]">
                    <Badge
                      variant="outline"
                      className="text-xs font-light uppercase tracking-widest text-muted-foreground"
                    >
                      Week {weekIdx + 1}
                    </Badge>
                    <div id="action menu" className="flex items-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-accent-foreground/50 hover:text-accent-foreground"
                            onClick={() => handleDuplicateWeek(weekIdx)}
                          >
                            <Icons.copy className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Duplicate Week</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div
                    id="workouts-data"
                    className="w-full flex-grow space-y-8"
                  >
                    {weeksWorkouts.map((workout, workoutIdx) => {
                      return (
                        <div key={workout.id} className="flex gap-4">
                          <div className="flex-grow space-y-4">
                            <div className="ml-[72px] flex items-center justify-between">
                              <EditableTypography
                                value={workout.name}
                                onChange={(value) => {
                                  const newWorkouts = weeksWorkouts.map((w) => {
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
                              />
                              <div
                                id="action menu"
                                className="flex items-center justify-center pl-2"
                              >
                                {workoutIdx === 0 && weekIdx === 0 ? null : (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-accent-foreground opacity-50 transition-opacity ease-in-out hover:opacity-100"
                                    onClick={() => handleDeletion(workout.id)}
                                  >
                                    <Icons.x className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <WorkoutGrid
                              rowData={workout.blocks}
                              columns={defaultColumns}
                              onGridChange={(rows) => {
                                // The grid updated. Right now, it's a little circular, might have to clean this up a little later,
                                // but grid updates update the global workout store, which cause a re-render of the grid.
                                const workoutToUpdate = workouts.find(
                                  (w) => w.id === workout.id
                                )
                                if (!workoutToUpdate) {
                                  return
                                }
                                const workoutRows: Workout['blocks'] = rows.map(
                                  (row) => {
                                    return {
                                      id: row.id || uuidv4().toString(),
                                      exercise_name: row.exercise_name,
                                      sets: row.sets,
                                      reps: row.reps,
                                      weight: row.weight || '',
                                      rest: row.rest || '',
                                      notes: row.notes || '',
                                    }
                                  }
                                )
                                const newWorkout = {
                                  ...workoutToUpdate,
                                  blocks: workoutRows,
                                }

                                const updatedworkouts = workouts.map((w) => {
                                  if (w.id === workout.id) {
                                    return newWorkout
                                  }
                                  return w
                                })

                                setWorkouts(updatedworkouts)
                              }}
                            />
                          </div>
                          <div className="mt-[48px] flex flex-col items-stretch">
                            <Button
                              id="next-week-workout-btn"
                              variant="dashed"
                              size="icon"
                              className="flex-grow text-sm font-normal"
                              onClick={() =>
                                addNewWorkoutToWeek({ week: weekIdx + 1 })
                              }
                            >
                              <Icons.plus className="h-4 w-4 rounded-full" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="flex w-full items-center justify-end pt-4">
                  <PlusButton
                    text="Add Workout"
                    onClick={() => addNewWorkoutToWeek({ week: weekIdx })}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
