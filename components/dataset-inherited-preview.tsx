import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { ClassificationVocabularyDoc } from "@/lib/catalogue/classification-vocabulary";
import { vocabularyLabel } from "@/lib/catalogue/classification-vocabulary";
import {
  formatAnatomyTagLabel,
  getDatasetAnatomyTags,
  getDatasetBodyRegions,
  getDatasetModalities,
  getDatasetTasks,
} from "@/lib/catalogue/filters";
import { getDatasetSeriesCount } from "@/lib/catalogue/scale";
import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 border-b border-border/30 py-3 last:border-0 dark:border-white/[0.08]">
      <span className="w-32 shrink-0 pt-0.5 text-xs text-muted-foreground/60 dark:text-white/38">
        {label}
      </span>
      <div className="min-w-0 flex-1 text-sm text-foreground/80 dark:text-white/70">
        {children}
      </div>
    </div>
  );
}

type DatasetInheritedPreviewProps = {
  dataset: DatasetCatalogueEntry;
  vocabulary: ClassificationVocabularyDoc;
};

export function DatasetInheritedPreview({
  dataset,
  vocabulary,
}: DatasetInheritedPreviewProps) {
  const modalities = getDatasetModalities(dataset);
  const tasks = getDatasetTasks(dataset);
  const bodyRegions = getDatasetBodyRegions(dataset, vocabulary);
  const anatomyTags = getDatasetAnatomyTags(dataset);
  const series = getDatasetSeriesCount(dataset);

  return (
    <div className="flex flex-col">
      <Row label="Name">{dataset.name}</Row>
      <Row label="Description">
        <p className="leading-relaxed text-muted-foreground/70 dark:text-white/45">
          {dataset.short_description}
        </p>
      </Row>
      {modalities.length > 0 ? (
        <Row label="Modality">
          <div className="flex flex-wrap gap-1.5">
            {modalities.map((m) => (
              <Badge key={m} variant="outline" className="font-normal">
                {vocabularyLabel(vocabulary, "modality", m)}
              </Badge>
            ))}
          </div>
        </Row>
      ) : null}
      {tasks.length > 0 ? (
        <Row label="Task">
          <div className="flex flex-wrap gap-1.5">
            {tasks.map((t) => (
              <Badge key={t} variant="outline" className="font-normal">
                {vocabularyLabel(vocabulary, "task", t)}
              </Badge>
            ))}
          </div>
        </Row>
      ) : null}
      {bodyRegions.length > 0 ? (
        <Row label="Body regions">
          <div className="flex flex-wrap gap-1.5">
            {bodyRegions.map((r) => (
              <Badge key={r} variant="outline" className="font-normal">
                {vocabularyLabel(vocabulary, "body_region", r)}
              </Badge>
            ))}
          </div>
        </Row>
      ) : null}
      {anatomyTags.length > 0 ? (
        <Row label="Anatomy tags">
          {anatomyTags.map(formatAnatomyTagLabel).join(", ")}
        </Row>
      ) : null}
      <Row label="Access">
        {vocabularyLabel(vocabulary, "access_level", dataset.access_level)}
      </Row>
      {(dataset.n_patients != null ||
        dataset.n_studies != null ||
        series != null) && (
        <Row label="Scale">
          {[
            dataset.n_patients != null ? `${dataset.n_patients} patients` : null,
            dataset.n_studies != null ? `${dataset.n_studies} studies` : null,
            series != null ? `${series} series` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Row>
      )}
    </div>
  );
}

export function DatasetParentLink({
  parentId,
  parentName,
}: {
  parentId: string;
  parentName: string;
}) {
  return (
    <p className="text-sm text-muted-foreground/70 dark:text-white/45">
      <Link
        href={`/datasets/${parentId}`}
        className="font-medium text-foreground underline-offset-4 hover:underline dark:text-white/80"
      >
        {parentName}
      </Link>
      <span className="ml-2 font-mono text-xs text-muted-foreground/50 dark:text-[#a8c4a2]/70">
        {parentId}
      </span>
    </p>
  );
}
