import { GitForkIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DerivativeCountBadgeProps = {
  count: number;
  className?: string;
};

export function DerivativeCountBadge({
  count,
  className,
}: DerivativeCountBadgeProps) {
  if (count <= 0) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 shrink-0 gap-1 border-[#C4674F]/45 bg-[#C4674F]/10 px-2 text-xs font-medium text-[#C4674F]",
        "dark:border-[#C4674F]/50 dark:bg-[#C4674F]/15 dark:text-[#e8a895]",
        className,
      )}
    >
      <GitForkIcon className="size-3 shrink-0" aria-hidden />
      {count} {count === 1 ? "derivative" : "derivatives"}
    </Badge>
  );
}
