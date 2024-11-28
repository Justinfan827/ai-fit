import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

export default function Tiptap({
  editorContent,
  setEditorContent,
}: {
  editorContent: string;
  // useState function
  setEditorContent: (content: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    autofocus: true,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
      },
    },
    content: editorContent,
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getText());
    },
  });

  useEffect(() => {
    // this is just an example. do whatever you want to do here
    // to retrieve your editors content from somewhere
    editor?.commands.setContent(editorContent);
  }, [editor]);

  return <EditorContent className="h-full w-full" editor={editor} />;
}
