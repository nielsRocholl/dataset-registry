"use client";

import { useMemo, useState } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type DatasetParentOption = {
  value: string;
  label: string;
};

type DatasetParentComboboxProps = {
  options: DatasetParentOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function DatasetParentCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Search datasets...",
  disabled = false,
}: DatasetParentComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input
          value={open ? query : (selected?.label ?? "")}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery(selected?.label ?? "");
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-9"
          autoComplete="off"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          className="absolute top-0 right-0 h-[42px] w-9 shrink-0 border-0 bg-transparent shadow-none hover:bg-transparent"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle dataset list"
        >
          <ChevronsUpDownIcon className="size-3.5 opacity-50" />
        </Button>
      </div>
      {open && filtered.length > 0 ? (
        <ul
          className={cn(
            "absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border/60 bg-popover py-1 shadow-md",
            "dark:border-white/[0.10] dark:bg-[#252523]",
          )}
          role="listbox"
        >
          {value ? (
            <li>
              <button
                type="button"
                className="flex w-full items-center px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/60"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onValueChange("");
                  setQuery("");
                  setOpen(false);
                }}
              >
                Clear selection
              </button>
            </li>
          ) : null}
          {filtered.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60",
                  option.value === value && "bg-muted/40",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onValueChange(option.value);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <CheckIcon
                  className={cn(
                    "size-3.5 shrink-0",
                    option.value === value ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="truncate">{option.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
