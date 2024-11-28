"use client";
import { Icons } from "@/components/icons";
import Tiptap from "@/components/tip-tap";
import { Button } from "@/components/ui/button";
import apiGenerateWorkoutPlan from "@/fetches/generate-workout";
import { useAsyncFetch } from "@/hooks/async-fetch";
import { useToast } from "@/hooks/use-toast";
import { useWorkoutPlan } from "@/hooks/use-workout";
import { useEffect, useState } from "react";

export default function ClientSide() {
  const defaultContent = `This is a capable client looking to workout 3x per week. Beginner intermediate. No real issues. Looking to focus on building bigger arms`;
  const [editorContent, setEditorContent] = useState(defaultContent);
  const { setWorkoutPlan } = useWorkoutPlan();
  const { toast } = useToast();

  const { runQuery, isPending } = useAsyncFetch({
    queryFunc: async () => {
      const { data, error } = await apiGenerateWorkoutPlan({
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
      setWorkoutPlan(data);
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
