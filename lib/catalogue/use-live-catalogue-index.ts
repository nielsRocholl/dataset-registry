"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";

export function useLiveCatalogueIndex(
  initialDatasets: DatasetCatalogueEntry[],
  initialGeneratedAt: string,
) {
  const [datasets, setDatasets] = useState(initialDatasets);
  const [generatedAt, setGeneratedAt] = useState(initialGeneratedAt);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    router.refresh();

    void (async () => {
      const res = await fetch("/api/catalogue/index", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok || cancelled) return;
      const body: unknown = await res.json().catch(() => null);
      if (
        cancelled ||
        !body ||
        typeof body !== "object" ||
        !("datasets" in body)
      ) {
        return;
      }
      const next = body as {
        datasets: DatasetCatalogueEntry[];
        generated_at?: string;
      };
      if (Array.isArray(next.datasets)) {
        setDatasets(next.datasets);
        if (typeof next.generated_at === "string") {
          setGeneratedAt(next.generated_at);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return { datasets, generatedAt };
}
