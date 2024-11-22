import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { generateWorkout } from "@/lib/ai/openai/client";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const resp = await generateWorkout({ prompt: body.prompt });
  return NextResponse.json(resp);
}
