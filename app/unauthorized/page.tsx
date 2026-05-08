"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth-shell";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
      <header className="flex flex-col gap-5">
        <Link
          href="/login"
          className="group inline-flex w-fit items-center gap-2 text-[length:var(--text-sm)] font-medium text-muted-foreground transition-[color] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] hover:text-foreground"
        >
          <ChevronLeftIcon
            className="size-4 shrink-0 transition-transform duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] group-hover:-translate-x-0.5"
            aria-hidden
          />
          Back to sign in
        </Link>
      </header>

      <article className="auth-panel px-5 py-6 sm:px-6 sm:py-7 md:px-7">
        <div className="relative flex flex-col gap-6">
          <header className="flex flex-col gap-3">
            <p className="ui-kicker">Diagnostic Image Analysis Group</p>
            <h1 className="ui-title">
              Not on the access list yet
            </h1>
          </header>

          <Separator />

          <div className="ui-copy flex flex-col gap-4">
            <p>
              GitHub confirms who you are, but this catalogue is only reachable
              for people the maintainers have approved for the group. Until you
              are added, dataset pages and catalogue APIs stay closed. Nothing is
              wrong with your password or browser.
            </p>
            <p>
              Reach out to a maintainer—often someone from Alessa&apos;s
              group—for access. Mention the email address linked to your
              GitHub account so they can match it to approvals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              className="h-9"
              onClick={() => void signOut()}
            >
              Sign out
            </Button>
            <Link
              href="mailto:?subject=Dataset%20catalogue%20access&amp;body=(Please%20include%20the%20email%20on%20your%20GitHub%20profile.)"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "h-9",
              )}
            >
              Draft access email
            </Link>
          </div>
          <p className="ui-note max-w-[60ch]">
            If you switched GitHub profiles, sign out above and retry with the
            account your maintainer recognises.
          </p>
        </div>
      </article>
    </AuthShell>
  );
}
