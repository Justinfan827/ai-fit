import type { infer as ZodInfer, ZodObject, ZodRawShape } from "zod"
import type { Maybe } from "@/lib/types/types"
import { getError } from "@/lib/utils/util"

type WithFetchResponseOpts<T extends ZodRawShape> = {
  fetchOpts?: RequestInit
  responseOpts: {
    expectedStatus?: number
    schema: ZodObject<T>
  }
}

/*
WithFetchResponse is a light wrapper around fetch that parses the response
into a Zod schema.
*/
async function withFetchResponse<T extends ZodRawShape>(
  url: string,
  opts: WithFetchResponseOpts<T>
): Promise<Maybe<ZodInfer<ZodObject<T>>>> {
  try {
    const res = await fetch(url, opts.fetchOpts)
    if (
      opts.responseOpts?.expectedStatus &&
      res.status !== opts.responseOpts.expectedStatus
    ) {
      return {
        error: new Error(
          `Expected status ${opts.responseOpts.expectedStatus} but got ${res.status}`
        ),
        data: null,
      }
    }

    const parsed = opts.responseOpts?.schema.safeParse(await res.json())
    if (!parsed.success) {
      return {
        error: new Error(parsed.error.message),
        data: null,
      }
    }
    return {
      data: parsed.data,
      error: null,
    }
  } catch (e) {
    return {
      error: getError(e),
      data: null,
    }
  }
}

/*
  withFetch is a light wrapper around fetch that returns a Maybe<undefined>
  and handles errors.
*/
async function withFetch(
  url: string,
  opts: {
    responseOpts: { expectedStatus: number }
    fetchOpts?: RequestInit
  }
): Promise<Maybe<undefined>> {
  try {
    const res = await fetch(url, opts.fetchOpts)
    if (
      opts.responseOpts?.expectedStatus &&
      res.status !== opts.responseOpts.expectedStatus
    ) {
      return {
        error: new Error(
          `Expected status ${opts.responseOpts.expectedStatus} but got ${res.status}`
        ),
        data: null,
      }
    }

    return {
      data: undefined,
      error: null,
    }
  } catch (e) {
    return {
      error: getError(e),
      data: null,
    }
  }
}

export { withFetch, withFetchResponse }
