"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth-shell";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function UnauthorizedPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <AuthShell>
      <header className="flex flex-col gap-5 pb-8">
        <Link
          href="/login"
          className="group inline-flex w-fit items-center gap-2 text-[length:var(--text-sm)] font-medium tracking-[-0.01em] text-muted-foreground transition-colors duration-[var(--duration-fast,150ms)] [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] hover:text-foreground"
        >
          <ChevronLeftIcon
            className="size-4 shrink-0 transition-transform duration-[var(--duration-fast,150ms)] [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] group-hover:-translate-x-0.5"
            aria-hidden
          />
          Back to sign in
        </Link>
      </header>

      <article className="auth-panel px-6 py-8 md:px-8 md:py-10">
        <header className="flex flex-col gap-3 border-b border-border pb-6">
          <p className="text-[length:var(--text-xs)] uppercase tracking-[0.14em] text-muted-foreground">
            Diagnostic Image Analysis Group
          </p>
          <h1 className="font-display text-[length:var(--text-3xl)] leading-[1.12] tracking-[-0.04em] text-foreground md:text-[length:var(--text-4xl)]">
            Not on the access list yet
          </h1>
        </header>

        <div className="flex flex-col gap-6 pt-7">
          <div className="flex max-w-[62ch] flex-col gap-4 text-[length:var(--text-base)] leading-relaxed text-muted-foreground">
            <p>
              GitHub confirms who you are, but this catalogue is only reachable
              for people the maintainers have approved for the group. Until you
              are added, dataset pages and catalogue APIs stay closed—nothing is
              wrong with your password or browser.
            </p>
            <p>
              Reach out to a maintainer—often someone from Alessa&apos;s
              group—for access. Mention the email address linked to your
              GitHub account so they can match it to approvals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              className="h-10 text-[length:var(--text-sm)] shadow-none transition-[transform,border-color,background-color] duration-[150ms] [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-px hover:border-foreground/20 active:translate-y-0"
              onClick={() => void signOut()}
            >
              Sign out
            </Button>
            <Link
              href="mailto:?subject=Dataset%20catalogue%20access&amp;body=(Please%20include%20the%20email%20on%20your%20GitHub%20profile.)"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "h-10 px-4 text-[length:var(--text-sm)] font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              Draft access email
            </Link>
          </div>
          <p className="max-w-[60ch] text-[length:var(--text-xs)] leading-relaxed text-muted-foreground">
            If you switched GitHub profiles, sign out above and retry with the
            account your maintainer recognises.
          </p>
        </div>
      </article>
    </AuthShell>
  );
}
