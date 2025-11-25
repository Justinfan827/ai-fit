import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

export function isDefined<T>(val: T | undefined | null): val is T {
  return val !== undefined && val !== null
}

// useful for switch statements on union types
export function exhaustiveGuard(_value: never): never {
  throw new Error(
    `ERROR! Reached forbidden guard function with unexpected value: ${JSON.stringify(
      _value
    )}`
  )
}

type ErrorWithMessage = {
  message: string
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  )
}

function toErrorWithMessage(maybeError: unknown): Error {
  if (isErrorWithMessage(maybeError)) return new Error(maybeError.message)
  try {
    return new Error(JSON.stringify(maybeError))
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError))
  }
}

// https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript
// helper for extracting error messages from unknown errors.
// useful for handling errors in catch blocks.
export function getError(error: unknown) {
  return toErrorWithMessage(error)
}

// sleep function
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function capitalizeFirstLetter(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatNumber(num: number) {
  return num.toLocaleString("en-US")
}

export function parseISO8601Date(dateString: string) {
  return dayjs.utc(dateString)
}

export function formatISO8601Date(date: dayjs.Dayjs, format: string) {
  return date.utc().format(format)
}

export function parseBool(str: string): boolean | undefined {
  const strLower = str.trim().toLowerCase()
  switch (strLower) {
    case "true":
    case "t":
    case "1":
    case "yes":
    case "y":
    case "enabled":
    case "on":
      return true
    case "false":
    case "f":
    case "0":
    case "no":
    case "n":
    case "disabled":
    case "off":
      return false
    default:
      return
  }
}

/*
 * Trims all leading and trailing whitespace from a string.
 */
export function inputTrim(input: string): string {
  return input.replace(/^\s+|\s+$/g, "")
}
