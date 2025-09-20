import { streamText } from "ai"
import { gatewayProviders } from "@/lib/ai/providers"
import log from "@/lib/logger/logger"
import { withAuthBodySchema } from "../middleware/withAuth"
import { evaluatePromptRequestSchema } from "./schema"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

const PROMPT_EVALUATION_SYSTEM = `You are an expert AI assistant specialized in evaluating and improving system prompts for AI applications. 

Your task is to analyze the provided system prompt and suggest concrete improvements to make it more effective, clear, and comprehensive.

When evaluating a system prompt, consider these key aspects:

## Clarity and Structure
- Is the prompt well-organized with clear sections?
- Are instructions specific and unambiguous?
- Is the language clear and professional?

## Completeness
- Does it cover all necessary context and constraints?
- Are edge cases and error handling addressed?
- Is the expected output format clearly defined?

## Effectiveness
- Does it guide the AI toward the desired behavior?
- Are examples provided where helpful?
- Does it prevent common AI pitfalls and misunderstandings?

## Best Practices
- Does it follow established prompt engineering principles?
- Is it appropriately scoped (not too broad or narrow)?
- Does it include proper guardrails and safety considerations?

## Specific Areas to Evaluate
- **Role Definition**: Is the AI's role clearly established?
- **Context Setting**: Is sufficient background provided?
- **Task Instructions**: Are the tasks clearly defined?
- **Output Format**: Is the expected response format specified?
- **Constraints & Guidelines**: Are limitations and rules clear?
- **Examples**: Are examples provided where they would help?
- **Tone & Style**: Is the desired communication style specified?

Provide your evaluation in this structure:

1. **Overall Assessment**: Brief summary of the prompt's strengths and main areas for improvement
2. **Specific Issues**: List concrete problems with explanations
3. **Recommended Improvements**: Actionable suggestions with examples
4. **Enhanced Prompt Sections**: Provide improved versions of key sections
5. **Additional Considerations**: Any other recommendations for optimization

Be constructive, specific, and actionable in your feedback. Focus on improvements that will have the most impact on AI performance and user experience.`

export const POST = withAuthBodySchema(
  { schema: evaluatePromptRequestSchema },
  ({ body: { systemPrompt } }) => {
    try {
      log.consoleWithHeader("Prompt evaluation request", {
        promptLength: systemPrompt.length,
      })

      const result = streamText({
        model: gatewayProviders["chat-model"],
        system: PROMPT_EVALUATION_SYSTEM,
        messages: [
          {
            role: "user",
            content: `Please evaluate and suggest improvements for this system prompt:

---SYSTEM PROMPT TO EVALUATE---
${systemPrompt}
---END SYSTEM PROMPT---

Provide a thorough analysis and concrete suggestions for improvement.`,
          },
        ],
        temperature: 0.7,
      })

      return result.toTextStreamResponse()
    } catch (error) {
      log.error("Prompt evaluation API Error:", { error })
      return Response.json(
        { error: "Failed to evaluate prompt" },
        { status: 500 }
      )
    }
  }
)
