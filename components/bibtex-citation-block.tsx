"use client";

import { CopyClipboardButton } from "@/components/copy-clipboard-button";

export function BibtexCitationBlock({ text }: { text: string }) {
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[length:var(--text-xs)] font-medium text-muted-foreground">
          BibTeX / citation
        </span>
        <CopyClipboardButton text={text} label="Copy citation" />
      </div>
      <pre className="max-h-[min(24rem,50vh)] overflow-auto rounded-xl border border-border bg-muted/30 p-3 font-mono text-[length:var(--text-xs)] leading-relaxed text-foreground whitespace-pre-wrap break-words">
        {text}
      </pre>
    </div>
  );
}
