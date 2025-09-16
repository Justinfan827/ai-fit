import { openai } from "@ai-sdk/openai"
import {
  customProvider,
  defaultSettingsMiddleware,
  type LanguageModel,
  wrapLanguageModel,
} from "ai"

export const myProvider = customProvider({
  languageModels: {
    "chat-model": wrapLanguageModel({
      model: openai("gpt-4.1"),
      middleware: defaultSettingsMiddleware({
        settings: {
          providerOptions: {
            openai: {
              // reasoningEffort: "high",
            },
          },
        },
      }),
    }),
    // 'chat-model-reasoning': wrapLanguageModel({
    //   model: openai('gpt-4o-mini'),
    //   middleware: extractReasoningMiddleware({ tagName: 'think' }),
    // }),
  },
})

export const gatewayProviders: Record<string, LanguageModel> = {
  "chat-model": "openai/gpt-4.1",
}
