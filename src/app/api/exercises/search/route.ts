import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { Exercise } from "@/lib/domain/exercises";
import { APIResponse } from "@/lib/types/apires";

export async function GET(request: NextRequest) {
  // query params
  const query = request.nextUrl.searchParams.get("query");
  if (!query) {
    return NextResponse.json([]);
  }
  const resp = await searchExercises({ query: query });
  return NextResponse.json(resp);
}

async function searchExercises({
  query,
}: {
  query: string;
}): Promise<APIResponse<Exercise[]>> {
  const ls = [
    {
      id: 1,
      name: "Bench Press",
    },
    {
      id: 2,
      name: "Squat",
    },
    {
      id: 3,
      name: "Deadlift",
    },
    {
      id: 4,
      name: "Overhead Press",
    },
  ];
  return {
    data: ls.filter((item) => {
      return item.name.toLowerCase().includes(query.toLowerCase());
    }),
    error: null,
  };
}
