import { cn } from "@/lib/utils";

import { CATALOGUE_FORM_FIELD_DARK_SCOPE } from "@/lib/catalogue/catalogue-surface-styles";

/** Label, helper, input, textarea, select trigger — matches dataset register form. */
export const CATALOGUE_FORM_FIELD_BODY_SCOPE = cn(
  "[&_[data-slot=field-label]]:mb-1.5 [&_[data-slot=field-label]]:text-[13px] [&_[data-slot=field-label]]:font-medium [&_[data-slot=field-label]]:text-foreground/75",
  "[&_[data-slot=field-description]]:mt-1 [&_[data-slot=field-description]]:text-[12px] [&_[data-slot=field-description]]:leading-[1.5] [&_[data-slot=field-description]]:text-muted-foreground/55",
  "[&_[data-slot=input]]:!h-[42px] [&_[data-slot=input]]:text-sm [&_[data-slot=input]]:font-normal",
  "[&_[data-slot=input]]:placeholder:text-muted-foreground/40",
  "[&_[data-slot=input]:enabled]:focus-visible:ring-0 [&_[data-slot=input]:enabled]:focus-visible:border-[#C4674F]/60 [&_[data-slot=input]:enabled]:focus-visible:shadow-[0_0_0_3px_rgba(196,103,79,0.08)]",
  "[&_[data-slot=textarea]]:min-h-20 [&_[data-slot=textarea]]:text-sm [&_[data-slot=textarea]]:font-normal",
  "[&_[data-slot=textarea]]:placeholder:text-muted-foreground/40",
  "[&_[data-slot=textarea]:enabled]:focus-visible:ring-0 [&_[data-slot=textarea]:enabled]:focus-visible:border-[#C4674F]/60 [&_[data-slot=textarea]:enabled]:focus-visible:shadow-[0_0_0_3px_rgba(196,103,79,0.08)]",
  "[&_[data-slot=select-trigger]]:rounded-md [&_[data-slot=select-trigger]]:!h-[42px] [&_[data-slot=select-trigger]]:!min-h-[42px]",
  "[&_[data-slot=select-trigger]:enabled]:focus-visible:ring-0 [&_[data-slot=select-trigger]:enabled]:focus-visible:border-[#C4674F]/60 [&_[data-slot=select-trigger]:enabled]:focus-visible:shadow-[0_0_0_3px_rgba(196,103,79,0.08)]",
);

/** Light scope + dark field surfaces for forms with inputs. */
export const CATALOGUE_FORM_FIELD_SCOPE = cn(
  CATALOGUE_FORM_FIELD_BODY_SCOPE,
  CATALOGUE_FORM_FIELD_DARK_SCOPE,
);

/** Full dataset editor `<form>` shell: vertical rhythm + field scope. */
export const DATASET_EDITOR_FORM_SCOPE = cn(
  "dataset-editor-scope flex flex-col gap-[16px] dark:gap-6",
  CATALOGUE_FORM_FIELD_SCOPE,
);
