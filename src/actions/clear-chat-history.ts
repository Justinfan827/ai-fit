"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { clearChatMessages } from "@/lib/supabase/server/chat-operations"
import { withAuthInput } from "./middleware/with-auth"

const schema = z.object({
  chatId: z.string(),
  programId: z.string(),
})

export const clearChatHistoryAction = withAuthInput(
  {
    schema,
  },
  async ({ input, user }) => {
    try {
      await clearChatMessages(input.chatId, user.userId)
      revalidatePath(`/home/studio/${input.programId}`)
      return { data: true, error: null }
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error : new Error("Unknown error occurred"),
      }
    }
  }
)
