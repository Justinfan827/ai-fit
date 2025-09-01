import chalk from "chalk"
import logSymbols from "log-symbols"

export function requireEnvVars(...envVars: (keyof NodeJS.ProcessEnv)[]) {
  const ret: Partial<NodeJS.ProcessEnv> = {}
  for (const key of envVars) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`)
    }
    ret[key] = process.env[key]
  }
  return ret
}

export const infoLog = (...args: string[]) => console.log(chalk.yellow(...args))
export const successLog = (...args: string[]) =>
  console.log(chalk.blue.bold(...args))
export const errorLog = (errMessage: string, fullError?: unknown) => {
  console.log(logSymbols.error, chalk.red.bold(errMessage))
  if (fullError) {
    console.log(fullError)
  }
}
