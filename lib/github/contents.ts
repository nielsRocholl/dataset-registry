const GH_API = "https://api.github.com";

export type RepoRef = { owner: string; repo: string };

export function parseRepository(): RepoRef {
  const raw = process.env.GITHUB_REPOSITORY?.trim();
  if (!raw?.includes("/")) {
    throw new Error("GITHUB_REPOSITORY must be owner/name");
  }
  const [owner, repo] = raw.split("/", 2);
  if (!owner || !repo?.trim()) {
    throw new Error("GITHUB_REPOSITORY must be owner/name");
  }
  return { owner, repo };
}

export function defaultBranch(): string {
  return process.env.GITHUB_DEFAULT_BRANCH?.trim() || "main";
}

async function ghFetch(jsonPath: string, init?: RequestInit): Promise<Response> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    throw new Error("GITHUB_TOKEN is not set");
  }
  const url = `${GH_API}${jsonPath.startsWith("/") ? "" : "/"}${jsonPath}`;
  return fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
}

type ContentsFileResp = {
  sha: string;
  content?: string;
  encoding?: string;
};

export async function getBlobFile(
  ref: RepoRef,
  blobPath: string,
  branch: string,
): Promise<{ sha: string; text: string } | null> {
  const encoded = blobPath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  const r = await ghFetch(
    `/repos/${ref.owner}/${ref.repo}/contents/${encoded}?ref=${encodeURIComponent(branch)}`,
  );
  if (r.status === 404) return null;
  if (!r.ok) {
    throw new Error(`GitHub GET contents failed (${r.status})`);
  }
  const j = (await r.json()) as ContentsFileResp;
  if (!j.sha || !j.content || j.encoding !== "base64") {
    throw new Error("GitHub contents response malformed");
  }
  const buf = Buffer.from(j.content.replace(/\s/g, ""), "base64");
  return { sha: j.sha, text: buf.toString("utf8") };
}

export type PutResult = {
  commit: { sha: string; html_url?: string };
  content: { sha: string };
};

export async function putBlobFile(
  ref: RepoRef,
  blobPath: string,
  branch: string,
  base64Content: string,
  message: string,
  existingSha?: string,
): Promise<PutResult> {
  const encoded = blobPath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  const body: Record<string, string> = {
    message,
    content: base64Content,
    branch,
  };
  if (existingSha) body.sha = existingSha;
  const r = await ghFetch(`/repos/${ref.owner}/${ref.repo}/contents/${encoded}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (r.status === 409 || r.status === 422) {
    throw new Error(`GitHub refused commit (${r.status})`);
  }
  if (!r.ok) {
    throw new Error(`GitHub PUT contents failed (${r.status})`);
  }
  return (await r.json()) as PutResult;
}
