"use client";

import { useCallback, useState, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyClipboardButtonProps = {
  text: string;
  label?: string;
  className?: string;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
};

async function writeClipboard(value: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = value;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  if (!ok) throw new Error("execCommand copy failed");
}

export function CopyClipboardButton({
  text,
  label = "Copy",
  className,
  size = "sm",
  variant = "outline",
}: CopyClipboardButtonProps) {
  const [hint, setHint] = useState<"idle" | "ok" | "err">("idle");

  const onCopy = useCallback(() => {
    void (async () => {
      try {
        await writeClipboard(text);
        setHint("ok");
        window.setTimeout(() => setHint("idle"), 1800);
      } catch {
        setHint("err");
        window.setTimeout(() => setHint("idle"), 2200);
      }
    })();
  }, [text]);

  const shown =
    hint === "ok" ? "Copied" : hint === "err" ? "Copy failed" : label;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={onCopy}
    >
      {shown}
    </Button>
  );
}
