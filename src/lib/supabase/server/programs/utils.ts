import { Blocks, Program, programSchema } from '@/lib/domain/workouts'
import { Maybe } from '@/lib/types/types'
import { createServerClient } from '../../create-server-client'
import { Database } from '../../database.types'
import { DBClient } from '../../types'

export async function resolveProgram(
  dbProgram: Database['public']['Tables']['programs']['Row']
): Promise<Maybe<Program>> {
  const client = await createServerClient()
  const { data: wData, error: wErr } = await client
    .from('workouts')
    .select('*')
    .eq('program_id', dbProgram.id)
    .order('program_order', { ascending: true })

  if (wErr) {
    return { data: null, error: wErr }
  }
  const program: Program = {
    id: dbProgram.id,
    type: dbProgram.type as 'weekly' | 'splits',
    name: dbProgram.name,
    created_at: dbProgram.created_at,
    workouts: wData.map((workout) => ({
      id: workout.id,
      program_order: workout.program_order,
      program_id: workout.program_id,
      name: workout.name,
      blocks: workout.blocks as Blocks,
    })),
  }
  const { data: programData, error: parseErr } =
    programSchema.safeParse(program)
  if (parseErr) {
    return { data: null, error: parseErr }
  }
  return {
    data: programData,
    error: null,
  }
}

export async function resolvePrograms(
  client: DBClient,
  pData: Database['public']['Tables']['programs']['Row'][]
): Promise<Maybe<Program[]>> {
  const returnData: Program[] = []
  const res = await Promise.all(
    pData.map(async (p) => {
      const { data: wData, error: wErr } = await client
        .from('workouts')
        .select('*')
        .eq('program_id', p.id)
        .order('program_order', { ascending: true })

      if (wErr) {
        return { error: wErr }
      }
      const program: Program = {
        id: p.id,
        name: p.name,
        created_at: p.created_at,
        type: p.type as 'weekly' | 'splits',
        workouts: wData.map((workout) => ({
          id: workout.id,
          program_order: workout.program_order,
          program_id: workout.program_id,
          name: workout.name,
          blocks: workout.blocks as Blocks,
        })),
      }
      const { data: programData, error: parseErr } =
        programSchema.safeParse(program)
      if (parseErr) {
        return { error: parseErr }
      }
      returnData.push(programData)
      return { error: null }
    })
  )

  for (const r of res) {
    if (r.error) {
      return { data: null, error: r.error }
    }
  }
  // need to sort the programs by created_at
  returnData.sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
  return {
    data: returnData,
    error: null,
  }
}
