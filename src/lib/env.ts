/**
 * Type-safe environment variable configuration
 */

// Define the shape of all environment variables used in the project
type AppProcessEnv = {
  // Next.js built-in variables
  NODE_ENV: "development" | "production" | "test"
  VERCEL?: string
  NEXT_RUNTIME?: string

  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string

  // Testing configuration
  PLAYWRIGHT_TEST_BASE_URL?: string
  PLAYWRIGHT?: string
  CI_PLAYWRIGHT?: string
}

// Type-safe access to process.env
const typedEnv = process.env as NodeJS.ProcessEnv & AppProcessEnv

/**
 * Validates that a required environment variable exists
 */
const getRequiredEnvVar = (varName: keyof AppProcessEnv): string => {
  const value = typedEnv[varName]
  if (!value) {
    throw new Error(`Missing required environment variable: ${varName}`)
  }
  return value
}

/**
 * Validates that required environment variables are present
 */
const validateRequiredEnvVars = (): void => {
  const requiredVars: (keyof AppProcessEnv)[] = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]

  const missingVars = requiredVars.filter((varName) => !typedEnv[varName])

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    )
  }
}

// Track validation state
let isValidated = false

/**
 * Ensures environment variables are validated
 */
const ensureValidated = (): void => {
  if (!isValidated) {
    validateRequiredEnvVars()
    isValidated = true
  }
}

/**
 * Get Supabase configuration with validation
 */
const getSupabaseConfig = () => {
  ensureValidated()
  return {
    url: getRequiredEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getRequiredEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: getRequiredEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
  }
}

/**
 * Get current environment
 */
const getNodeEnv = (): AppProcessEnv["NODE_ENV"] => {
  return typedEnv.NODE_ENV || "development"
}

/**
 * Check if running in production
 */
const isProduction = (): boolean => {
  return getNodeEnv() === "production"
}

/**
 * Check if running in development
 */
const isDevelopment = (): boolean => {
  return getNodeEnv() === "development"
}

/**
 * Check if running in test environment
 */
const isTest = (): boolean => {
  return getNodeEnv() === "test"
}

/**
 * Check if running on Vercel
 */
const isVercel = (): boolean => {
  return Boolean(typedEnv.VERCEL)
}

/**
 * Check if running in edge runtime
 */
const isEdgeRuntime = (): boolean => {
  return typedEnv.NEXT_RUNTIME === "edge"
}

/**
 * Get testing configuration
 */
const getTestConfig = () => {
  return {
    baseUrl: typedEnv.PLAYWRIGHT_TEST_BASE_URL,
    isPlaywright: Boolean(typedEnv.PLAYWRIGHT),
    isCiPlaywright: Boolean(typedEnv.CI_PLAYWRIGHT),
  }
}

export {
  getSupabaseConfig,
  getNodeEnv,
  isProduction,
  isDevelopment,
  isTest,
  isVercel,
  isEdgeRuntime,
  getTestConfig,
  getRequiredEnvVar,
}

export type { AppProcessEnv }
