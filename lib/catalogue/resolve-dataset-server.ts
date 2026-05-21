import { cookies, headers } from "next/headers";

import { getDatasetById } from "@/lib/catalogue/load-index";
import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";

async function catalogueFetch(path: string): Promise<Response | undefined> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  if (!cookieHeader) return undefined;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return undefined;
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  return fetch(`${origin}${path}`, {
    cache: "no-store",
    headers: { Cookie: cookieHeader },
  });
}

/**
 * Resolve a dataset for server-rendered pages: prefer build-time `generated/index.json`,
 * then same-origin GET of the catalogue API (GitHub-backed) when the index is stale —
 * e.g. after a write from this app before `git pull` / `generate:index`.
 */
export async function getDatasetEntryServer(
  id: string,
): Promise<DatasetCatalogueEntry | undefined> {
  const fromIndex = getDatasetById(id);
  if (fromIndex) return fromIndex;

  const res = await catalogueFetch(`/api/catalogue/datasets/${id}`);
  if (!res?.ok) return undefined;

  const data: unknown = await res.json().catch(() => null);
  if (
    !data ||
    typeof data !== "object" ||
    typeof (data as { id?: unknown }).id !== "string"
  ) {
    return undefined;
  }
  return data as DatasetCatalogueEntry;
}

export async function getDatasetDescriptionServer(
  id: string,
): Promise<string | null> {
  const res = await catalogueFetch(`/api/catalogue/datasets/${id}/description`);
  if (!res?.ok) return null;
  const text = (await res.text()).trim();
  return text || null;
}
