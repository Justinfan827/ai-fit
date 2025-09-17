"use client"

import { useState } from "react"
import { Markdown } from "@/components/markdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PromptViewerProps {
  content: string
}

export const PromptViewer = ({ content }: PromptViewerProps) => {
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered")

  const toggleViewMode = () => {
    setViewMode(viewMode === "rendered" ? "raw" : "rendered")
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Prompt Content</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={viewMode === "rendered" ? "default" : "secondary"}>
              {viewMode === "rendered" ? "Rendered" : "Raw Markdown"}
            </Badge>
            <Button
              onClick={toggleViewMode}
              size="sm"
              type="button"
              variant="outline"
            >
              {viewMode === "rendered" ? "Show Raw" : "Show Rendered"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "rendered" ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown>{content}</Markdown>
          </div>
        ) : (
          <pre className="overflow-auto whitespace-pre-wrap rounded-md bg-muted p-4 font-mono text-sm leading-relaxed">
            {content}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}
