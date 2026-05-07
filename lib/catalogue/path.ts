/** Matches stem rules in schema/dataset.schema.json `id.pattern`. */
export function assertDatasetSlug(id: string): boolean {
  if (id.length < 1 || id.length > 128) return false;
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$|^[a-z0-9]$/.test(id);
}

export function catalogueJsonPath(id: string): string {
  return `datasets/${id}.json`;
}

export function catalogueMdPath(id: string): string {
  return `datasets/${id}.md`;
}
