import { cn } from "@/lib/utils";

export const CATALOGUE_PAGE_MAIN_CN = "dark:bg-[#111110]";

export const CATALOGUE_BACK_LINK_CN =
  "dark:text-white/45 dark:hover:text-white/75";

export const CATALOGUE_SECTION_CARD_CN =
  "dark:border-white/[0.08] dark:bg-[#1c1c1a] dark:shadow-[0_1px_6px_rgba(0,0,0,0.35)]";

export const CATALOGUE_SECTION_HEADER_CN = "dark:border-white/[0.08]";

export const CATALOGUE_SECTION_TITLE_ACCENT_CN = "dark:border-[#C4674F]/60";

export const CATALOGUE_SECTION_TITLE_CN = "dark:text-white/85";

export const CATALOGUE_SECTION_DESC_CN = "dark:text-white/40";

export const CATALOGUE_LIST_ROW_CN = cn(
  CATALOGUE_SECTION_CARD_CN,
  "dark:hover:border-white/[0.14] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.4)]",
);

/** Stronger lift/shadow for dataset browse rows on /datasets. */
export const CATALOGUE_BROWSE_ROW_HOVER_CN = cn(
  "transition-[border-color,box-shadow,transform,background-color] duration-[var(--duration-normal)] [transition-timing-function:var(--ease-out-expo)]",
  "hover:-translate-y-1 hover:border-border hover:bg-muted/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.14)]",
  "dark:hover:-translate-y-1 dark:hover:border-white/[0.22] dark:hover:bg-[#242422] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.58)]",
);

export const CATALOGUE_MASTHEAD_CARD_CN = CATALOGUE_SECTION_CARD_CN;

export const CATALOGUE_CHIP_CN =
  "dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-white/60";

export const CATALOGUE_CHIP_AUTHOR_CN = "dark:bg-white/[0.06]";

export const CATALOGUE_DETAIL_LABEL_CN = "dark:text-white/70";

export const CATALOGUE_DETAIL_VALUE_CN = "dark:text-white/90";

export const CATALOGUE_DETAIL_VALUE_MONO_CN = "dark:text-[#a8c4a2]";

export const CATALOGUE_MONO_BLOCK_CN =
  "dark:border-white/[0.10] dark:bg-[#252523] dark:text-[#a8c4a2]";

export const CATALOGUE_SEARCH_ACTION_CN =
  "dark:border-white/[0.10] dark:bg-[#252523] dark:hover:border-white/[0.18]";

export const CATALOGUE_FORM_FIELD_DARK_SCOPE = cn(
  "[&_[data-slot=field-label]]:dark:text-white/70",
  "[&_[data-slot=field-description]]:dark:text-white/38",
  "[&_[data-slot=input]]:dark:border-white/[0.10] [&_[data-slot=input]]:dark:bg-[#252523] [&_[data-slot=input]]:dark:text-white/90",
  "[&_[data-slot=input]]:dark:placeholder:text-white/25",
  "[&_[data-slot=input]:enabled]:dark:hover:border-white/[0.18]",
  "[&_[data-slot=input]:enabled]:dark:focus-visible:border-[#C4674F]/50 [&_[data-slot=input]:enabled]:dark:focus-visible:bg-[#2e2e2b] [&_[data-slot=input]:enabled]:dark:focus-visible:shadow-[0_0_0_3px_rgba(196,103,79,0.12)]",
  "[&_[data-slot=input].font-mono]:dark:text-[#a8c4a2]",
  "[&_[data-slot=textarea]]:dark:!border-white/[0.10] [&_[data-slot=textarea]]:dark:!bg-[#252523] [&_[data-slot=textarea]]:dark:text-white/90",
  "[&_[data-slot=textarea]]:dark:placeholder:text-white/25",
  "[&_[data-slot=textarea]:enabled]:dark:hover:border-white/[0.18]",
  "[&_[data-slot=textarea]:enabled]:dark:focus-visible:border-[#C4674F]/50 [&_[data-slot=textarea]:enabled]:dark:focus-visible:!bg-[#2e2e2b] [&_[data-slot=textarea]:enabled]:dark:focus-visible:shadow-[0_0_0_3px_rgba(196,103,79,0.12)]",
  "[&_[data-slot=textarea].font-mono]:dark:text-[#a8c4a2]",
  "[&_[data-slot=select-trigger]]:dark:border-white/[0.10] [&_[data-slot=select-trigger]]:dark:bg-[#252523] [&_[data-slot=select-trigger]]:dark:text-white/90",
  "[&_[data-slot=select-trigger]:enabled]:dark:hover:border-white/[0.18]",
  "[&_[data-slot=select-trigger]:enabled]:dark:focus-visible:border-[#C4674F]/50 [&_[data-slot=select-trigger]:enabled]:dark:focus-visible:bg-[#2e2e2b] [&_[data-slot=select-trigger]:enabled]:dark:focus-visible:shadow-[0_0_0_3px_rgba(196,103,79,0.12)]",
);

export const FORM_TOGGLE_CHIP_CN =
  "!h-[34px] !min-h-0 min-w-0 shrink-0 rounded-full border border-border/60 bg-transparent px-[14px] text-[13px] font-normal text-foreground/65 shadow-none transition-all duration-150 hover:bg-muted/60 hover:border-border hover:text-foreground focus-visible:border-[#C4674F]/60 focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_rgba(196,103,79,0.08)] aria-pressed:border-[#C4674F]/40 aria-pressed:bg-[#C4674F]/10 aria-pressed:text-[#C4674F] aria-pressed:font-medium data-[pressed]:border-[#C4674F]/40 data-[pressed]:bg-[#C4674F]/10 data-[pressed]:text-[#C4674F] data-[pressed]:font-medium dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-white/60 dark:hover:border-white/[0.16] dark:hover:bg-white/[0.07] dark:aria-pressed:border-[#C4674F]/45 dark:aria-pressed:bg-[#C4674F]/18 dark:aria-pressed:text-[#e8896f] dark:data-[pressed]:border-[#C4674F]/45 dark:data-[pressed]:bg-[#C4674F]/18 dark:data-[pressed]:text-[#e8896f]";
