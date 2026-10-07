"use client";

import type { ReactNode } from "react";

interface ChipProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  icon?: ReactNode;
}

export function Chip({ selected, onClick, children, icon }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all duration-150 active:scale-[0.97] ${
        selected
          ? "bg-forest-800 text-cream-50 shadow-warm"
          : "bg-white text-ink-700 edge-soft hover:bg-cream-100"
      }`}
    >
      {icon ? <span className={selected ? "opacity-90" : "opacity-55"}>{icon}</span> : null}
      {children}
    </button>
  );
}
