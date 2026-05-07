"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Access not granted</CardTitle>
          <CardDescription className="text-pretty">
            You signed in with GitHub, but your email is not on this
            app&apos;s allowlist, or GitHub did not expose a primary email.
            Ask a maintainer to add your GitHub email (lowercase) to{" "}
            <code className="rounded bg-muted px-1 text-foreground">
              CATALOGUE_ALLOWLIST_EMAILS
            </code>{" "}
            in env, redeploy, then sign in again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" disabled={pending} onClick={() => void signOut()}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
