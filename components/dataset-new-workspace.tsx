"use client";

import { useMemo, useState } from "react";

import { DatasetEditorForm } from "@/components/dataset-editor-form";
import { DatasetEditorPageHeader } from "@/components/dataset-editor-page-header";
import type { ClassificationVocabularyDoc } from "@/lib/catalogue/classification-vocabulary";
import { filterRootDatasets } from "@/lib/catalogue/derivatives";
import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";

type DatasetNewWorkspaceProps = {
  classificationVocabulary: ClassificationVocabularyDoc;
  allDatasets: DatasetCatalogueEntry[];
  initialParentId?: string;
  lockParent?: boolean;
};

export function DatasetNewWorkspace({
  classificationVocabulary,
  allDatasets,
  initialParentId,
  lockParent = false,
}: DatasetNewWorkspaceProps) {
  const rootDatasets = useMemo(
    () => filterRootDatasets(allDatasets),
    [allDatasets],
  );
  const [derivativeParentId, setDerivativeParentId] = useState(
    initialParentId ?? "",
  );

  const parent = useMemo(
    () => rootDatasets.find((d) => d.id === derivativeParentId),
    [rootDatasets, derivativeParentId],
  );

  const isDerivativeMode = Boolean(derivativeParentId && parent);

  const derivativeStorageSeed = parent
    ? {
        storage_on_server: parent.storage_on_server !== false,
        internal_storage_path:
          parent.storage_on_server === false
            ? ""
            : (parent.internal_storage_path ?? ""),
      }
    : undefined;

  return (
    <>
      <DatasetEditorPageHeader
        kicker={isDerivativeMode ? "New derivative" : "New entry"}
        title={isDerivativeMode ? parent!.name : "Register a dataset"}
        subtitle={
          isDerivativeMode
            ? "Inherited metadata is fixed; describe what changed."
            : "Add the minimum metadata researchers need to find, judge, and request access to the dataset."
        }
      />

      <DatasetEditorForm
        mode="new"
        classificationVocabulary={classificationVocabulary}
        allDatasets={allDatasets}
        rootDatasets={rootDatasets}
        derivativeParentId={derivativeParentId}
        lockDerivativeParent={lockParent && Boolean(initialParentId)}
        onDerivativeParentChange={setDerivativeParentId}
        derivativeStorageSeed={derivativeStorageSeed}
      />
    </>
  );
}
