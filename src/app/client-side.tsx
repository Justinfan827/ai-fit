"use client";
import { Icons } from "@/components/icons";
import Tiptap from "@/components/tip-tap";
import { Button } from "@/components/ui/button";
import { useAsyncFetch } from "@/hooks/async-fetch";
import apiGenerateWorkout from "@/fetches/generate-workout";
import { useWorkout } from "@/hooks/use-workout";
import React, { useEffect, useState } from "react";
import { workoutSchema } from "@/lib/ai/openai/schema";
import { useToast } from "@/hooks/use-toast";

export default function ClientSide() {
  const defaultContent = `This is a capable client looking to workout 3x per week. Beginner intermediate. No real issues. Looking to focus on building bigger arms`;
  const [editorContent, setEditorContent] = useState(defaultContent);
  const { setWorkout } = useWorkout();
  const { toast } = useToast();

  const { runQuery, isPending } = useAsyncFetch({
    queryFunc: async () => {
      const { data, error } = await apiGenerateWorkout({
        prompt: editorContent,
      });
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      setWorkout(data);
    },
  });
  const handleOnClick = async () => {
    runQuery();
  };

  useEffect(() => {
    runQuery();
  }, []);

  return (
    <>
      <Tiptap
        editorContent={editorContent}
        setEditorContent={setEditorContent}
      />
      <Button
        onClick={handleOnClick}
        className="hover: w-[200px] transition-transform"
      >
        {isPending ? (
          <Icons.spinner className="h-5 w-5 animate-spin" />
        ) : (
          "Generate Workout ⚡️"
        )}
      </Button>
    </>
  );
}
