import { confirm, input } from "@inquirer/prompts"
import { Command } from "commander"
import {
  buildSystemPrompt,
  buildWorkoutModificationPrompt,
} from "@/lib/ai/prompts/prompts"
import log from "@/lib/logger/logger"
import { getError } from "@/lib/utils/util"
import runUserCreation from "./cmd-create-user"
import { testExercises, testWorkouts } from "./testdata"
import { errorLog, requireEnvVars, successLog } from "./utils"

// dashctl is a cli for our portal
// Use it to help setup local dev
const program = new Command()

program
  .command("create-user")
  .option("-e, --email <email>", "Email of user to create")
  .description("Create a user")
  .action(async (options) => {
    const email =
      options.email || (await input({ message: "User Email to create?" }))
    const isTrainer = await confirm({ message: "Is this a trainer?" })
    const { SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL } =
      requireEnvVars("SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_URL")
    try {
      await runUserCreation({
        email: email!,
        supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY!,
        supabaseURL: NEXT_PUBLIC_SUPABASE_URL!,
        opts: {
          isTrainer,
        },
      })

      successLog("done")
    } catch (err) {
      errorLog(getError(err).message)
    }
  })

program
  .command("starter-pack")
  .description("Create a test user trainer@gmail.com and client.gmail.com")
  .action(async (options) => {
    const { SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL } =
      requireEnvVars("SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_URL")
    try {
      const trainerId = await runUserCreation({
        email: "trainer@test.com",
        supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY!,
        supabaseURL: NEXT_PUBLIC_SUPABASE_URL!,
        opts: {
          isTrainer: true,
        },
      })

      await runUserCreation({
        email: "client@test.com",
        supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY!,
        supabaseURL: NEXT_PUBLIC_SUPABASE_URL!,
        opts: {
          isTrainer: false,
          setTrainerId: trainerId,
        },
      })

      successLog("done")
    } catch (err) {
      errorLog(getError(err).message)
    }
  })

program
  .command("test-prompts")
  .description("Test prompts")
  .action(() => {
    const builtPrompt = buildSystemPrompt(testExercises, testWorkouts)
    log.consoleWithHeader("Built prompt", builtPrompt)
    const updateWorkoutProgramPrompt = buildWorkoutModificationPrompt(
      testExercises,
      testWorkouts
    )
    log.consoleWithHeader(
      "Update workout program prompt",
      updateWorkoutProgramPrompt
    )
  })

program.parse(process.argv)
