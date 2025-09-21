import { confirm, input } from "@inquirer/prompts"
import { Command } from "commander"
import { getError } from "@/lib/utils/util"
import runUserCreation from "./cmd-create-user"
import { seedExercises } from "./seed-platform-exercises"
import { errorLog, requireEnvVars, successLog } from "./utils"

// dashctl is a cli for our portal
// Use it to help setup local dev
const program = new Command()

program
  .command("create-user")
  .option("-e, --email <email>", "Email of user to create")
  .option("-p, --password <password>", "Password of user to create")
  .option("-f, --first <first>", "First name of user to create")
  .option("-l, --last <last>", "Last name of user to create")
  .description("Create a user")
  .action(async (options) => {
    const email =
      options.email || (await input({ message: "User Email to create?" }))
    const password =
      options.password ||
      (await input({
        message: "User password? Skip to generate a random password",
      }))
    const first =
      options.first || (await input({ message: "User first name to create?" }))
    const last =
      options.last || (await input({ message: "User last name to create?" }))
    if (!first) {
      errorLog("First name is required")
      process.exit(1)
    }
    if (!last) {
      errorLog("Last name is required")
      process.exit(1)
    }
    if (!password) {
      // TODO: use a random password generator
      errorLog("Password is required")
      process.exit(1)
    }
    const isTrainer = await confirm({ message: "Is this a trainer?" })
    const { SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL } =
      requireEnvVars("SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_URL")
    try {
      const { userId } = await runUserCreation({
        email,
        password,
        first,
        last,
        supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY || "",
        supabaseURL: NEXT_PUBLIC_SUPABASE_URL || "",
        opts: {
          isTrainer,
        },
      })

      successLog("User created successfully")
      successLog(`User email: ${email}`)
      successLog(`User password: ${password}`)
      successLog(`User ID: ${userId}`)
    } catch (err) {
      errorLog(getError(err).message)
    }
  })

program
  .command("seed-exercises")
  .description("Seed exercises")
  .action(async () => {
    const { SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL } =
      requireEnvVars("SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_URL")

    const userId = await input({ message: "User ID to seed exercises for?" })
    if (!userId) {
      errorLog("User ID is required")
      process.exit(1)
    }
    await seedExercises({
      userId,
      supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY || "",
      supabaseURL: NEXT_PUBLIC_SUPABASE_URL || "",
    })
  })

program.parse(process.argv)
