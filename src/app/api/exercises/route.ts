import 'server-only'

import { createServerClient } from '@/lib/supabase/create-server-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const client = await createServerClient()
  const { data, error } = await client.from('exercises').select('*')
  console.log({ error })
  return NextResponse.json({ data })
}
