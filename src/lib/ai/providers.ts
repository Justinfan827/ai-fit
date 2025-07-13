import { openai } from "@ai-sdk/openai"
import { customProvider } from "ai"

export const myProvider = customProvider({
  languageModels: {
    "chat-model": openai("gpt-4o"),
    // 'chat-model-reasoning': wrapLanguageModel({
    //   model: openai('gpt-4o-mini'),
    //   middleware: extractReasoningMiddleware({ tagName: 'think' }),
    // }),
  },
})
