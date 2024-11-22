import { exerciseSchema } from "@/lib/domain/exercises";
import { getError } from "@/lib/utils/util";

export default async function apiGetExercises(body: { searchString: string }) {
  try {
    const res = await fetch(`/api/search-exercises`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: new Headers({ "Content-Type": "application/json" }),
    });
    if (!res.ok) {
      const bodyMsg = await res.text();
      return {
        error: new Error(bodyMsg || res.statusText),
      };
    }

    const { data: apiData } = await res.json();
    const { data, error } = exerciseSchema.safeParse(apiData);
    if (error) {
      return {
        data: null,
        error: new Error(error.message),
      };
    }
    return {
      data,
      error: null,
    };
  } catch (e) {
    return {
      error: getError(e),
    };
  }
}

// generic async fetcher
