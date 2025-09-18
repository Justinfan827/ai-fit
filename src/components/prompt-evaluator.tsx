"use client"

import { AlertCircle, CheckCircle, Loader2, Sparkles } from "lucide-react"
import { useState } from "react"
import { Markdown } from "@/components/markdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PromptEvaluatorProps {
  systemPrompt: string
  onEvaluationComplete?: (evaluation: string) => void
}

export const PromptEvaluator = ({
  systemPrompt,
  onEvaluationComplete,
}: PromptEvaluatorProps) => {
  const [evaluationStarted, setEvaluationStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [evaluation, setEvaluation] = useState<string>("")

  const handleStartEvaluation = async () => {
    setEvaluationStarted(true)
    setIsLoading(true)
    setError(null)
    setEvaluation("")

    try {
      const response = await fetch("/api/evaluate-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

      let accumulatedText = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        accumulatedText += chunk
        setEvaluation(accumulatedText)
      }

      onEvaluationComplete?.(accumulatedText)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const hasEvaluation = evaluation.length > 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              AI Prompt Evaluator
            </CardTitle>
            <Badge className="text-xs" variant="outline">
              GPT-5
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground text-sm">
            Get AI-powered suggestions to improve your system prompt. The
            evaluator will analyze clarity, completeness, effectiveness, and
            provide specific recommendations.
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="flex items-center gap-2"
              disabled={isLoading || !systemPrompt.trim()}
              onClick={handleStartEvaluation}
              type="button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Evaluate Prompt
                </>
              )}
            </Button>

            {evaluationStarted && !isLoading && hasEvaluation && (
              <Badge
                className="flex items-center gap-1 text-green-600"
                variant="outline"
              >
                <CheckCircle className="h-3 w-3" />
                Complete
              </Badge>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-600 text-sm dark:bg-red-950/20">
              <AlertCircle className="h-4 w-4" />
              Error: {error}
            </div>
          )}
        </CardContent>
      </Card>

      {(isLoading || hasEvaluation) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evaluation Results</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing your prompt and generating suggestions...
              </div>
            )}

            {hasEvaluation && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Markdown>{evaluation}</Markdown>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
