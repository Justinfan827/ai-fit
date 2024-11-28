import "server-only";

import { generateWorkout } from "@/lib/ai/openai/client";
import { sleep } from "@/lib/utils/util";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const resp = await generateWorkout({ prompt: body.prompt });
  return NextResponse.json(resp);
}
