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
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";
import type { CatalogueUser } from "@/lib/catalogue/editor-session";
import { cn } from "@/lib/utils";

type CatalogueShellProps = {
  children: ReactNode;
  datasets?: DatasetCatalogueEntry[];
  starredDatasets?: DatasetCatalogueEntry[];
  canCreate?: boolean;
  currentUser?: CatalogueUser | null;
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
  starredDatasets = [],
  canCreate = false,
  currentUser = null,
  className,
}: CatalogueShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const recent = datasets.slice(0, 10);
  const starred = starredDatasets.slice(0, 6);
  const accountName = currentUser?.displayName ?? "DIAG member";
  const accountSubline = currentUser?.isAdmin ? "Admin" : "Dataset catalogue";

  async function signOut() {
    setPending(true);
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function focusSearch() {
    if (pathname !== "/datasets/search") {
      router.push("/datasets/search#catalogue-search");
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
                href="/datasets/search"
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
              aria-current={pathname === "/datasets" ? "page" : undefined}
              aria-label={sidebarCollapsed ? "Datasets" : undefined}
              title={sidebarCollapsed ? "Datasets" : undefined}
              className={cn(
                "flex h-11 items-center rounded-xl text-[length:var(--text-lg)] font-normal text-sidebar-foreground outline-none transition-[background-color,color] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/35",
                sidebarCollapsed ? "justify-center px-0" : "gap-3 px-2.5",
                pathname === "/datasets" && "bg-muted",
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
              aria-current={pathname === "/datasets/search" ? "page" : undefined}
              aria-label={sidebarCollapsed ? "Search datasets" : undefined}
              title={sidebarCollapsed ? "Search" : undefined}
              onClick={focusSearch}
              className={cn(
                "h-11 w-full rounded-xl text-[length:var(--text-lg)] font-normal text-sidebar-foreground hover:bg-muted hover:text-sidebar-foreground",
                sidebarCollapsed ? "justify-center px-0" : "justify-start gap-3 px-2.5",
                pathname === "/datasets/search" && "bg-muted",
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
            {canCreate ? (
              <Link
                href="/datasets/new"
                aria-label={sidebarCollapsed ? "New dataset" : undefined}
                title={sidebarCollapsed ? "New dataset" : undefined}
                className={cn(
                  "flex h-11 items-center rounded-xl text-[length:var(--text-lg)] font-normal text-sidebar-foreground outline-none transition-[background-color,color] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/35",
                  sidebarCollapsed ? "justify-center px-0" : "gap-3 px-2.5",
                )}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-transparent">
                  <FilePlus2Icon className="size-6" aria-hidden />
                </span>
                {!sidebarCollapsed ? <span className="truncate">New dataset</span> : null}
              </Link>
            ) : (
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
                  <span className="truncate">New dataset</span>
                ) : null}
              </div>
            )}
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
            {currentUser?.isAdmin ? (
              <Link
                href="/datasets/admin"
                aria-current={pathname === "/datasets/admin" ? "page" : undefined}
                aria-label={sidebarCollapsed ? "Admin" : undefined}
                title={sidebarCollapsed ? "Admin" : undefined}
                className={cn(
                  "flex h-11 items-center rounded-xl text-[length:var(--text-lg)] font-normal text-sidebar-foreground outline-none transition-[background-color,color] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/35",
                  sidebarCollapsed ? "justify-center px-0" : "gap-3 px-2.5",
                  pathname === "/datasets/admin" && "bg-muted",
                )}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-transparent">
                  <ShieldCheckIcon className="size-6" aria-hidden />
                </span>
                {!sidebarCollapsed ? <span className="truncate">Admin</span> : null}
              </Link>
            ) : null}
          </nav>

          {!sidebarCollapsed ? (
            <div className="mt-10 flex min-h-0 flex-1 flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="px-2.5 text-[length:var(--text-base)] text-muted-foreground">
                  Starred
                </p>
                <div className="flex flex-col gap-1.5">
                  {starred.length > 0 ? (
                    starred.map((dataset) => (
                      <Link
                        key={dataset.id}
                        href={`/datasets/${dataset.id}`}
                        className="rounded-xl px-2.5 py-1.5 text-[length:var(--text-base)] leading-snug text-sidebar-foreground outline-none transition-[background-color] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/35"
                      >
                        <span className="block truncate">{dataset.name}</span>
                      </Link>
                    ))
                  ) : (
                    <p className="px-2.5 py-1.5 text-[length:var(--text-base)] leading-snug text-muted-foreground/70">
                      No starred datasets
                    </p>
                  )}
                  {starredDatasets.length > starred.length ? (
                    <Link
                      href="/datasets/starred"
                      className="rounded-xl px-2.5 py-1.5 text-[length:var(--text-sm)] leading-snug text-muted-foreground outline-none transition-[background-color,color] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] hover:bg-muted hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-ring/35"
                    >
                      View all starred
                    </Link>
                  ) : null}
                </div>
              </div>
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
            <Link
              href="/datasets/mine"
              aria-label="My datasets"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-[length:var(--text-base)] font-medium text-primary-foreground outline-none transition-[background-color,box-shadow,opacity,transform] duration-[var(--duration-fast)] [box-shadow:var(--shadow-button)] [transition-timing-function:var(--ease-out-quart)] hover:-translate-y-px hover:bg-primary/90 hover:opacity-95 hover:[box-shadow:var(--shadow-button-hover)] focus-visible:ring-2 focus-visible:ring-ring/35 active:translate-y-px"
            >
              {initials(accountName) || <UserRoundIcon aria-hidden />}
            </Link>
            {!sidebarCollapsed ? (
              <Link
                href="/datasets/mine"
                className="min-w-0 flex-1 rounded-md outline-none transition-[opacity] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/35"
              >
                <p className="truncate text-[length:var(--text-sm)] font-medium text-sidebar-foreground">
                  {accountName}
                </p>
                <p className="truncate text-[length:var(--text-xs)] text-muted-foreground">
                  {accountSubline}
                </p>
              </Link>
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
        <Link href="/datasets/search" className="font-display text-[length:var(--text-xl)]">
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
