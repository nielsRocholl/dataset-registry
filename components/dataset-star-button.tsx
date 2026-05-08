"use client";

import { useRouter } from "next/navigation";
import { StarIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DatasetStarButtonProps = {
  datasetId: string;
  initialStarred: boolean;
  label?: string;
  className?: string;
};

export function DatasetStarButton({
  datasetId,
  initialStarred,
  label,
  className,
}: DatasetStarButtonProps) {
  const router = useRouter();
  const [starred, setStarred] = useState(initialStarred);
  const [pending, setPending] = useState(false);

  async function toggleStar() {
    const next = !starred;
    setStarred(next);
    setPending(true);
    try {
      const res = await fetch(`/api/catalogue/stars/${datasetId}`, {
        method: next ? "PUT" : "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setStarred(!next);
        return;
      }
      router.refresh();
    } catch {
      setStarred(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={label ? "sm" : "icon-sm"}
      aria-label={starred ? "Unstar dataset" : "Star dataset"}
      aria-pressed={starred}
      disabled={pending}
      onClick={() => void toggleStar()}
      className={cn(
        "text-muted-foreground hover:text-foreground aria-pressed:text-brand",
        className,
      )}
    >
      <StarIcon
        data-icon={label ? "inline-start" : undefined}
        className={cn(starred && "fill-current")}
        aria-hidden
      />
      {label ? <span>{starred ? "Starred" : label}</span> : null}
    </Button>
  );
}
