"use client";

import { useState } from "react";

import { createBrowserSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field";

type LoginFormProps = {
  next?: string;
  error?: string;
} & React.ComponentProps<"div">;

export function LoginForm({
  next,
  error,
  className,
  ...props
}: LoginFormProps) {
  const [pending, setPending] = useState(false);

  async function signInGitHub() {
    setPending(true);
    try {
      const supabase = createBrowserSupabase();
      const origin = window.location.origin;
      const safeNext = next?.startsWith("/") ? next : "/";
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
        },
      });
      if (oauthErr) {
        setPending(false);
      }
    } catch {
      setPending(false);
    }
  }

  return (
    <div
      className={cn(
        "auth-panel px-6 py-8 md:px-8 md:py-10",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-[length:var(--text-xl)] font-medium tracking-[-0.02em] text-foreground">
            Sign in with GitHub
          </h2>
          <p className="max-w-[62ch] text-[length:var(--text-base)] leading-relaxed text-muted-foreground">
            This catalogue is restricted to approved members of the Diagnostic
            Image Analysis Group. If your GitHub account is not cleared by the
            maintainers yet, finishing sign-in will send you to a short page that
            explains next steps—you will not see dataset content.
          </p>
          <FieldGroup className="mt-4">
            <Field>
              <Button
                type="button"
                disabled={pending}
                className="h-11 w-full text-[length:var(--text-sm)] font-medium shadow-none transition-[transform,background-color,color,box-shadow] duration-[150ms] [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-px hover:shadow-[0_4px_14px_-2px_color-mix(in_oklch,var(--color-accent)_32%,transparent)] active:translate-y-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                onClick={() => void signInGitHub()}
              >
                <svg
                  data-icon="inline-start"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    fill="currentColor"
                    d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"
                  />
                </svg>
                Continue with GitHub
              </Button>
              <FieldDescription className="mx-auto mt-6 max-w-[56ch] text-center text-[length:var(--text-xs)] leading-relaxed text-muted-foreground">
                By continuing you use GitHub to prove identity only; access is still
                decided by DIAG maintainers inside this application.
              </FieldDescription>
            </Field>
            {error === "auth" ? (
              <FieldDescription className="text-center text-[length:var(--text-sm)] text-destructive">
                Sign-in failed. Confirm Supabase Redirect URLs match this host and try
                again.
              </FieldDescription>
            ) : null}
          </FieldGroup>
        </div>
      </div>
    </div>
  );
}
