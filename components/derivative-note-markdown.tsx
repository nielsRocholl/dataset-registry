import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

type DerivativeNoteMarkdownProps = {
  content: string;
  className?: string;
};

export function DerivativeNoteMarkdown({
  content,
  className,
}: DerivativeNoteMarkdownProps) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none text-foreground/80 dark:text-white/70",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
