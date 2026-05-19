"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { Tooltip } from "@base-ui/react/tooltip";
import * as React from "react";

import { cn } from "@/lib/utils";

type CatalogueCollapsedTooltipProps = {
  /** When false, renders `children` only (expanded sidebar). */
  show: boolean;
  /** Primary line — button name. */
  title: string;
  /** Secondary line — what happens when you click. */
  hint?: string;
  children: React.ReactElement;
};

/**
 * Hover tooltip for narrow sidebar icons. Uses Trigger `render` + `cloneElement`
 * so Next `Link`, `Button`, and bare div triggers keep correct semantics.
 */
export function CatalogueCollapsedTooltip({
  show,
  title,
  hint,
  children,
}: CatalogueCollapsedTooltipProps) {
  if (!show) {
    return children;
  }

  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        delay={220}
        closeDelay={40}
        closeOnClick={false}
        render={(props) =>
          React.cloneElement(
            children,
            mergeProps(children.props as Record<string, unknown>, props) as Partial<
              (typeof children)["props"]
            >,
          )
        }
      />
      <Tooltip.Portal>
        <Tooltip.Positioner
          align="center"
          className="z-50 outline-none"
          collisionPadding={16}
          side="right"
          sideOffset={10}
        >
          <Tooltip.Popup
            className={cn(
              "rounded-lg border border-white/10 bg-neutral-900 px-2.5 py-1.5 text-neutral-50",
              "shadow-lg shadow-black/20 outline-none",
              "dark:border-white/[0.12] dark:shadow-black/35",
            )}
          >
            <div className="max-w-[14rem] leading-snug">
              <p className="text-xs font-medium text-neutral-50">{title}</p>
              {hint ? (
                <p className="mt-0.5 text-[11px] leading-snug text-neutral-400">
                  {hint}
                </p>
              ) : null}
            </div>
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
