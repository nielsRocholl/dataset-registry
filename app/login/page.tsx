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
      <header className="flex flex-col gap-2">
        <p className="text-[length:var(--text-xs)] uppercase tracking-[0.14em] text-muted-foreground">
          Diagnostic Image Analysis Group
        </p>
        <h1 className="text-[length:var(--text-3xl)] font-semibold leading-tight tracking-[-0.03em] text-foreground md:text-[length:var(--text-4xl)]">
          Dataset catalogue
        </h1>
      </header>

      <LoginForm next={next} error={error} />
    </AuthShell>
  );
}
