import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const error = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <AuthShell>
      <header className="flex flex-col gap-3">
        <p className="ui-kicker">Diagnostic Image Analysis Group</p>
        <h1 className="ui-title">Dataset catalogue</h1>
        <p className="ui-copy">
          Internal dataset metadata and storage paths for approved group members.
        </p>
      </header>

      <LoginForm next={next} error={error} />
    </AuthShell>
  );
}
