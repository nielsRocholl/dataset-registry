"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpenIcon,
  DatabaseIcon,
  FilePlus2Icon,
  LogOutIcon,
  PanelLeftIcon,
  SearchIcon,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";

type CatalogueShellProps = {
  children: ReactNode;
  datasets?: DatasetCatalogueEntry[];
  className?: string;
};

function initials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function CatalogueShell({
  children,
  datasets = [],
  className,
}: CatalogueShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const recent = datasets.slice(0, 10);

  async function signOut() {
    setPending(true);
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function focusSearch() {
    if (pathname !== "/datasets") {
      router.push("/datasets#catalogue-search");
      return;
    }

    document.getElementById("catalogue-search")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    window.setTimeout(() => {
      document.getElementById("dataset-search")?.focus();
    }, 180);
  }

  return (
    <div className={cn("app-surface min-h-svh bg-background", className)}>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-[var(--duration-normal)] [transition-timing-function:var(--ease-out-quart)] lg:flex",
          sidebarCollapsed ? "w-20" : "w-[23.5rem]",
        )}
      >
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col py-4 transition-[padding] duration-[var(--duration-normal)] [transition-timing-function:var(--ease-out-quart)]",
            sidebarCollapsed ? "px-3" : "px-5",
          )}
        >
          <div
            className={cn(
              "mb-7 flex items-center",
              sidebarCollapsed ? "justify-center" : "justify-between",
            )}
          >
            {!sidebarCollapsed ? (
              <Link
                href="/datasets"
                className="font-display text-[2.125rem] leading-none text-sidebar-foreground outline-none transition-[opacity] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/35"
              >
                Catalogue
              </Link>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!sidebarCollapsed}
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
              className="size-8 text-muted-foreground hover:bg-transparent hover:text-foreground aria-expanded:bg-transparent"
            >
              <PanelLeftIcon className="size-6" data-icon="inline-start" />
            </Button>
          </div>

          <nav className="flex flex-col gap-1.5">
            <Link
              href="/datasets"
              aria-label={sidebarCollapsed ? "Datasets" : undefined}
              title={sidebarCollapsed ? "Datasets" : undefined}
              className={cn(
                "flex h-11 items-center rounded-xl text-[length:var(--text-lg)] font-normal text-sidebar-foreground outline-none transition-[background-color,color] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/35",
                sidebarCollapsed ? "justify-center px-0" : "gap-3 px-2.5",
              )}
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-transparent">
                <DatabaseIcon className="size-6" aria-hidden />
              </span>
              {!sidebarCollapsed ? <span className="truncate">Datasets</span> : null}
            </Link>
            <Button
              type="button"
              variant="ghost"
              aria-label={sidebarCollapsed ? "Search datasets" : undefined}
              title={sidebarCollapsed ? "Search" : undefined}
              onClick={focusSearch}
              className={cn(
                "h-11 w-full rounded-xl text-[length:var(--text-lg)] font-normal text-sidebar-foreground hover:bg-muted hover:text-sidebar-foreground",
                sidebarCollapsed ? "justify-center px-0" : "justify-start gap-3 px-2.5",
              )}
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-transparent">
                <SearchIcon
                  className={cn("size-6", sidebarCollapsed && "-translate-x-px -translate-y-px")}
                  data-icon="inline-start"
                />
              </span>
              {!sidebarCollapsed ? <span className="truncate">Search</span> : null}
            </Button>
            <div
              className={cn(
                "flex h-11 items-center rounded-xl text-[length:var(--text-lg)] text-muted-foreground/60",
                sidebarCollapsed ? "justify-center px-0" : "gap-3 px-2.5",
              )}
              aria-disabled="true"
              title={sidebarCollapsed ? "New dataset" : undefined}
            >
              <span className="flex size-8 items-center justify-center rounded-full">
                <FilePlus2Icon className="size-6" aria-hidden />
              </span>
              {!sidebarCollapsed ? (
                <>
                  <span className="truncate">New dataset</span>
                  <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-[length:var(--text-xs)] text-muted-foreground">
                    Phase 6
                  </span>
                </>
              ) : null}
            </div>
            <div
              className={cn(
                "flex h-11 items-center rounded-xl text-[length:var(--text-lg)] text-muted-foreground/60",
                sidebarCollapsed ? "justify-center px-0" : "gap-3 px-2.5",
              )}
              aria-disabled="true"
              title={sidebarCollapsed ? "Guidelines" : undefined}
            >
              <span className="flex size-8 items-center justify-center rounded-full">
                <BookOpenIcon className="size-6" aria-hidden />
              </span>
              {!sidebarCollapsed ? <span className="truncate">Guidelines</span> : null}
            </div>
          </nav>

          {!sidebarCollapsed ? (
            <div className="mt-10 flex min-h-0 flex-1 flex-col gap-4">
              <p className="px-2.5 text-[length:var(--text-base)] text-muted-foreground">
                Recents
              </p>
              <div className="flex min-h-0 flex-col gap-1.5 overflow-y-auto pr-1">
                {recent.map((dataset) => (
                  <Link
                    key={dataset.id}
                    href={`/datasets/${dataset.id}`}
                    className="rounded-xl px-2.5 py-1.5 text-[length:var(--text-base)] leading-snug text-sidebar-foreground outline-none transition-[background-color] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/35"
                  >
                    <span className="block truncate">{dataset.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1" />
          )}
        </div>

        <div
          className={cn(
            "border-t border-sidebar-border py-4",
            sidebarCollapsed ? "px-3" : "px-5",
          )}
        >
          <div
            className={cn(
              "flex items-center",
              sidebarCollapsed ? "flex-col gap-2" : "gap-3",
            )}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-[length:var(--text-base)] font-medium text-primary-foreground">
              {initials("DIAG member")}
            </div>
            {!sidebarCollapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[length:var(--text-sm)] font-medium text-sidebar-foreground">
                  DIAG member
                </p>
                <p className="truncate text-[length:var(--text-xs)] text-muted-foreground">
                  Dataset catalogue
                </p>
              </div>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={pending}
              aria-label="Sign out"
              onClick={() => void signOut()}
            >
              <LogOutIcon data-icon="inline-start" />
            </Button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 lg:hidden">
        <Link href="/datasets" className="font-display text-[length:var(--text-xl)]">
          Catalogue
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => void signOut()}
        >
          Sign out
        </Button>
      </header>

      <div
        className={cn(
          "min-h-svh transition-[padding-left] duration-[var(--duration-normal)] [transition-timing-function:var(--ease-out-quart)]",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-[23.5rem]",
        )}
      >
        <div className="flex min-h-svh flex-col">{children}</div>
      </div>
    </div>
  );
}
