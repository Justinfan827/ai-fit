export default function FinishRunInstancePage({
  params: _params,
}: {
  params: Promise<{
    clientId: string
    programId: string
    workoutId: string
    instanceId: string
  }>
}) {
  return <div className="w-full space-y-2 p-2">Finished</div>
}
