"use client";

import { CopyClipboardButton } from "@/components/copy-clipboard-button";

export function BibtexCitationBlock({ text }: { text: string }) {
  return (
    <div className="grid gap-2">
      <span className="text-[length:var(--text-xs)] font-medium text-muted-foreground">
        BibTeX / citation
      </span>
      <div className="relative">
        <CopyClipboardButton
          text={text}
          label="Copy citation"
          iconOnly
          className="absolute right-2 top-2 z-10"
        />
        <pre className="max-h-[min(24rem,50vh)] overflow-auto rounded-xl border border-border bg-muted/30 p-3 pr-10 font-mono text-[length:var(--text-xs)] leading-relaxed whitespace-pre-wrap break-words text-foreground">
          {text}
        </pre>
      </div>
    </div>
  );
}
