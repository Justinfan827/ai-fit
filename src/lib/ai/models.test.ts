import { simulateReadableStream } from 'ai'
import { MockLanguageModelV1 } from 'ai/test'
// TODO: get this from ai chatbot
// import { getResponseChunksByPrompt } from '@/tests/prompts/utils';

export const chatModel = new MockLanguageModelV1({
  doGenerate: async () => ({
    rawCall: { rawPrompt: null, rawSettings: {} },
    finishReason: 'stop',
    usage: { promptTokens: 10, completionTokens: 20 },
    text: `Hello, world!`,
  }),
  doStream: async ({ prompt }) => ({
    stream: simulateReadableStream({
      chunkDelayInMs: 500,
      initialDelayInMs: 1000,
      // chunks: getResponseChunksByPrompt(prompt),
      chunks: [],
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  }),
})
