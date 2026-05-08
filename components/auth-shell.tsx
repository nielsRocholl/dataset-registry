import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell app-surface flex min-h-svh flex-col items-center justify-center px-5 py-10 sm:px-8 md:px-12">
      <div className="flex w-full max-w-[min(29rem,calc(100vw-2rem))] flex-col gap-8">
        {children}
      </div>
    </div>
  );
}
