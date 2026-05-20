"use client";

import { useCallback, useState, type ComponentProps } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyClipboardButtonProps = {
  text: string;
  label?: string;
  className?: string;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
  /** Icon-only control for inline code paths (Claude / MD style). */
  iconOnly?: boolean;
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
  iconOnly = false,
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

  if (iconOnly) {
    const ariaLabel =
      hint === "ok"
        ? "Copied"
        : hint === "err"
          ? "Copy failed"
          : label;
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        title={ariaLabel}
        className={cn(
          "inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground/50 transition-[color,background-color] duration-150",
          "hover:bg-muted/50 hover:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
          hint === "ok" && "text-foreground/70",
          hint === "err" && "text-destructive/80",
          className,
        )}
        onClick={onCopy}
      >
        {hint === "ok" ? (
          <CheckIcon className="size-3.5" strokeWidth={2.25} aria-hidden />
        ) : (
          <CopyIcon className="size-3.5" strokeWidth={2} aria-hidden />
        )}
      </button>
    );
  }

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
