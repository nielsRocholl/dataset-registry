export default function Home() {
  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-16 sm:px-10 lg:px-16">
      <div className="max-w-[65ch]">
        <h1 className="font-display text-[length:var(--text-4xl)] leading-tight tracking-[-0.04em] text-foreground">
          Dataset catalogue
        </h1>
        <p className="mt-6 text-[length:var(--text-lg)] leading-relaxed text-muted">
          Internal inventory of dataset metadata and storage paths—no patient data here.
        </p>
        <p className="mt-10 text-[length:var(--text-sm)] text-placeholder select-none">
          Dataset list (/datasets) — not wired yet.
        </p>
      </div>
    </main>
  );
}
