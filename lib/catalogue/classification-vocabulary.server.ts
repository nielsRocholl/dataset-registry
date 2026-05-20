import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";

import { unstable_cache } from "next/cache";

import type { ClassificationVocabularyDoc } from "@/lib/catalogue/classification-vocabulary";
import { parseClassificationVocabularyJson } from "@/lib/catalogue/classification-vocabulary";
import {
  defaultBranch,
  getBlobFile,
  parseRepository,
  putBlobFile,
} from "@/lib/github/contents";

export const CLASSIFICATION_VOCABULARY_CACHE_TAG =
  "classification-vocabulary-live";

/** Path relative to repo root committed to GitHub. */
export const CLASSIFICATION_VOCABULARY_BLOB_PATH =
  "config/classification-vocabulary.json";

async function classificationVocabularyFromDisk(): Promise<ClassificationVocabularyDoc> {
  const abs = path.join(
    process.cwd(),
    CLASSIFICATION_VOCABULARY_BLOB_PATH,
  );
  const rawText = fs.readFileSync(abs, "utf8");
  const parsed: unknown = JSON.parse(rawText);
  const doc = parseClassificationVocabularyJson(parsed);
  if (!doc) {
    throw new Error("Malformed config/classification-vocabulary.json");
  }
  return doc;
}

async function classificationVocabularyFromGitHubUncached(): Promise<ClassificationVocabularyDoc> {
  let repo;
  try {
    repo = parseRepository();
  } catch {
    return classificationVocabularyFromDisk();
  }
  if (!process.env.GITHUB_TOKEN?.trim()) return classificationVocabularyFromDisk();

  try {
    const branch = defaultBranch();
    const blob = await getBlobFile(
      repo,
      CLASSIFICATION_VOCABULARY_BLOB_PATH,
      branch,
    );
    if (!blob) return classificationVocabularyFromDisk();
    const parsed: unknown = JSON.parse(blob.text);
    const doc = parseClassificationVocabularyJson(parsed);
    if (doc) {
      mirrorVocabularyDiskIfStale(blob.text);
      return doc;
    }
    return classificationVocabularyFromDisk();
  } catch {
    return classificationVocabularyFromDisk();
  }
}

const classificationVocabularyFromGitHubCached = unstable_cache(
  classificationVocabularyFromGitHubUncached,
  ["classification-vocabulary-blob"],
  { revalidate: 30, tags: [CLASSIFICATION_VOCABULARY_CACHE_TAG] },
);

/** Bypass Next data cache — use after admin vocabulary writes or client refresh. */
export async function loadClassificationVocabularyUncached(): Promise<ClassificationVocabularyDoc> {
  return classificationVocabularyFromGitHubUncached();
}

/** Live vocabulary: GitHub contents when credentials exist, otherwise local checkout. */
export async function loadClassificationVocabularyLive(): Promise<ClassificationVocabularyDoc> {
  if (
    !process.env.GITHUB_TOKEN?.trim() ||
    !process.env.GITHUB_REPOSITORY?.trim()
  ) {
    return classificationVocabularyFromDisk();
  }
  return classificationVocabularyFromGitHubCached();
}

export async function fetchClassificationBlobMeta(): Promise<
  | { sha: string; missing: false }
  | { missing: true }
> {
  const repo = parseRepository();
  const branch = defaultBranch();
  const blob = await getBlobFile(
    repo,
    CLASSIFICATION_VOCABULARY_BLOB_PATH,
    branch,
  );
  if (!blob) return { missing: true };
  return { sha: blob.sha, missing: false };
}

export async function writeClassificationVocabularyToGitHub(
  bodyUtf8: string,
  existingSha: string | undefined,
  message: string,
): Promise<{ commitSha: string; contentSha: string }> {
  const repo = parseRepository();
  const branch = defaultBranch();
  const b64 = Buffer.from(bodyUtf8, "utf8").toString("base64");
  const result = await putBlobFile(
    repo,
    CLASSIFICATION_VOCABULARY_BLOB_PATH,
    branch,
    b64,
    message,
    existingSha,
  );
  syncClassificationVocabularyToDisk(bodyUtf8);
  return {
    commitSha: result.commit.sha,
    contentSha: result.content.sha,
  };
}

/** Keep checkout in sync after GitHub commits (admin API does not pull otherwise). */
export function syncClassificationVocabularyToDisk(bodyUtf8: string): void {
  const abs = path.join(process.cwd(), CLASSIFICATION_VOCABULARY_BLOB_PATH);
  fs.writeFileSync(abs, bodyUtf8, "utf8");
}

function mirrorVocabularyDiskIfStale(bodyUtf8: string): void {
  const abs = path.join(process.cwd(), CLASSIFICATION_VOCABULARY_BLOB_PATH);
  try {
    if (fs.readFileSync(abs, "utf8") === bodyUtf8) return;
  } catch {
    /* missing local file */
  }
  syncClassificationVocabularyToDisk(bodyUtf8);
}
