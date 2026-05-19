import type { ReactNode } from "react";
import { AsteriskIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type DatasetEditorPageHeaderProps = {
  kicker: string;
  title: ReactNode;
  subtitle: string;
  /** Override subtitle width/token row (default `max-w-[480px]`). */
  subtitleClassName?: string;
  /** Muted line under subtitle (e.g. index timestamp on browse hubs). */
  footnote?: ReactNode;
  /** Right column in masthead row — links, buttons (e.g. Search / New dataset). */
  actions?: ReactNode;
};

/** Masthead shared by dataset tools and browse hubs (/datasets, /datasets/mine, /datasets/starred, /datasets/new, edit, /datasets/admin). */
export function DatasetEditorPageHeader({
  kicker,
  title,
  subtitle,
  subtitleClassName,
  footnote,
  actions,
}: DatasetEditorPageHeaderProps) {
  const textBlock = (
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/60">
        {kicker}
      </p>
      <h1 className="font-display mt-2 text-4xl font-[450] leading-tight tracking-[-0.02em] text-foreground">
        {title}
      </h1>
      <p
        className={cn(
          "mt-3 text-[15px] leading-[1.6] text-muted-foreground/70",
          subtitleClassName ?? "max-w-[480px]",
        )}
      >
        {subtitle}
      </p>
      {footnote ? (
        <div className="mt-2 text-xs text-muted-foreground/60">{footnote}</div>
      ) : null}
    </div>
  );

  return (
    <header className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
      <div
        className={cn(
          "border-b border-border/30 px-7 py-9 sm:px-8",
          actions
            ? "flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-x-8"
            : "flex items-start gap-4",
        )}
      >
        {actions ? (
          <>
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <AsteriskIcon
                className="mt-1 size-10 shrink-0 text-brand drop-shadow-[0_2px_8px_rgba(196,103,79,0.25)]"
                aria-hidden
              />
              {textBlock}
            </div>
            <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">
              {actions}
            </div>
          </>
        ) : (
          <>
            <AsteriskIcon
              className="mt-1 size-10 shrink-0 text-brand drop-shadow-[0_2px_8px_rgba(196,103,79,0.25)]"
              aria-hidden
            />
            {textBlock}
          </>
        )}
      </div>
    </header>
  );
}
