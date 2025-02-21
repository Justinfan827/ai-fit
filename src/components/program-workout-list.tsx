export async function ProgramWorkoutList({ programId }: { programId: string }) {
  return null
  // const [workouts, instances] = await Promise.all([
  //   getProgramById(programId),
  //   getWorkoutInstances(programId),
  // ])
  //
  // if (workouts.error) {
  //   return <div>error: {workouts.error.message}</div>
  // }
  //
  // if (instances.error) {
  //   return <div>error: {instances.error.message}</div>
  // }
  //
  // const activeInstances = instances.data.filter((instance) => !instance.end_at)
  // const completedInstances = instances.data.filter(
  //   (instance) => instance.end_at
  // )
  //
  // return (
  //   <div className="space-y-8">
  //     <div className="space-y-4">
  //       <Tp variant="h3">Active</Tp>
  //       <div id="history-container">
  //         {activeInstances.map((instance, idx) => (
  //           <Link
  //             href={`/home/programs/${programId}/workouts/${instance.workout_id}/run/${instance.id}`}
  //             key={instance.id}
  //             className={cn(
  //               'flex border-x border-b border-neutral-700 px-4 py-4 transition-colors ease-in-out hover:bg-neutral-800',
  //               idx === 0 && 'rounded-t-sm border-t',
  //               idx === instances.data.length - 1 && 'rounded-b-sm border-b'
  //             )}
  //           >
  //             <div>
  //               <p>{instance.workout_name}</p>
  //               <p className="font-mono text-xs text-neutral-400">
  //                 Day{' '}
  //                 {workouts.data.workouts.find(
  //                   (w) => w.id === instance.workout_id
  //                 )!.program_order + 1}
  //               </p>
  //             </div>
  //           </Link>
  //         ))}
  //       </div>
  //     </div>
  //     <div className="space-y-4">
  //       <Tp variant="h3">Workouts</Tp>
  //       <div id="workouts-container" className="">
  //         {workouts.data.workouts.map((workout, idx) => (
  //           <Link
  //             href={`/home/programs/${programId}/workouts/${workout.id}`}
  //             key={workout.id}
  //             className={cn(
  //               'flex border-x border-b border-neutral-700 px-4 py-4 transition-colors ease-in-out hover:bg-neutral-800',
  //               idx === 0 && 'rounded-t-sm border-t',
  //               idx === workouts.data.workouts.length - 1 &&
  //                 'rounded-b-sm border-b'
  //             )}
  //           >
  //             <div>
  //               <p>{workout.name}</p>
  //               <p className="font-mono text-xs text-neutral-400">
  //                 Day {workout.program_order + 1}
  //               </p>
  //             </div>
  //           </Link>
  //         ))}
  //       </div>
  //     </div>
  //     <div className="space-y-4">
  //       <Tp variant="h3">Completed</Tp>
  //       <div id="history-container">
  //         {completedInstances.map((instance, idx) => (
  //           <Link
  //             href={`/home/programs/${programId}/workouts/${instance.workout_id}/run/${instance.id}`}
  //             key={instance.id}
  //             className={cn(
  //               'flex border-x border-b border-neutral-700 px-4 py-2 transition-colors ease-in-out hover:bg-neutral-800',
  //               idx === 0 && 'rounded-t-sm border-t',
  //               idx === instances.data.length - 1 && 'rounded-b-sm border-b'
  //             )}
  //           >
  //             <div>
  //               <p>{instance.workout_name}</p>
  //               <p className="font-mono text-xs text-neutral-400">
  //                 {dayjs(instance.end_at).format('MMM D YYYY')}
  //               </p>
  //             </div>
  //           </Link>
  //         ))}
  //       </div>
  //     </div>
  //   </div>
  // )
}
