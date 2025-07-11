import { openai } from "@ai-sdk/openai"
import { customProvider } from "ai"
import { chatModel } from "@/lib/ai/models.test"
import { isTestEnvironment } from "@/lib/constants"

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        "chat-model": chatModel,
      },
    })
  : customProvider({
      languageModels: {
        "chat-model": openai("gpt-4o-mini"),
        // 'chat-model-reasoning': wrapLanguageModel({
        //   model: openai('gpt-4o-mini'),
        //   middleware: extractReasoningMiddleware({ tagName: 'think' }),
        // }),
      },
    })
