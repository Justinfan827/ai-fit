import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function isLive() {
  return process.env.NODE_ENV === "production"
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}
