"use client";

import { CopyClipboardButton } from "@/components/copy-clipboard-button";

export function BibtexCitationBlock({ text }: { text: string }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg border bg-muted p-4 pr-10 font-mono text-xs leading-relaxed text-muted-foreground">
        {text}
      </pre>
      <CopyClipboardButton
        text={text}
        label="Copy citation"
        iconOnly
        className="absolute right-2 top-2 h-7 w-7"
      />
    </div>
  );
}
