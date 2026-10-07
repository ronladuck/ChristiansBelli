"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface FieldRowProps {
  icon: ReactNode;
  label: ReactNode;
  /** Right-hand slot; defaults to a chevron when onClick is provided. */
  trailing?: ReactNode;
  onClick?: () => void;
  badge?: number;
}

export function FieldRow({ icon, label, trailing, onClick, badge }: FieldRowProps) {
  const content = (
    <>
      <span className="grid size-6 shrink-0 place-items-center text-forest-700">{icon}</span>
      <span className="flex-1 text-left text-[15px] font-medium text-forest-900">{label}</span>
      {badge ? (
        <span className="grid size-5 place-items-center rounded-full bg-forest-800 text-[11px] font-semibold text-cream-50">
          {badge}
        </span>
      ) : null}
      {trailing ?? <ChevronRight size={18} strokeWidth={2.2} className="text-ink-400" />}
    </>
  );

  const shell =
    "flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 edge-soft transition-colors";

  if (!onClick) {
    return <div className={shell}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${shell} hover:bg-cream-100 active:scale-[0.995]`}
    >
      {content}
    </button>
  );
}
