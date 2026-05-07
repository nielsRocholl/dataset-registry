import type { ReactNode } from "react";

/** Centered shell: calm neutrals + single accent glow (claude-design). */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-16 md:px-12">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_110%_70%_at_50%_-25%,color-mix(in_oklch,var(--color-accent)_14%,transparent),transparent)]"
        aria-hidden
      />
      <div className="flex w-full max-w-[min(28rem,calc(100vw-3rem))] flex-col gap-12">
        {children}
      </div>
    </div>
  );
}
