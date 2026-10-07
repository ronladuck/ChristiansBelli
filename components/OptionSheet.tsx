"use client";

import { Check } from "lucide-react";
import { BottomSheet } from "./ui/BottomSheet";

interface Option {
  id: string;
  label: string;
}

interface OptionSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  options: Option[];
  /** Single-select closes on choose; multi-select stays open with a Done button. */
  mode: "single" | "multi";
  selected: string[];
  onChange: (selected: string[]) => void;
  hint?: string;
}

export function OptionSheet({
  open,
  onClose,
  title,
  options,
  mode,
  selected,
  onChange,
  hint,
}: OptionSheetProps) {
  const toggle = (id: string) => {
    if (mode === "single") {
      onChange([id]);
      onClose();
      return;
    }
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        mode === "multi" ? (
          <div className="flex items-center gap-3">
            {selected.length > 0 ? (
              <button
                type="button"
                onClick={() => onChange([])}
                className="rounded-full px-4 py-3 text-[15px] font-semibold text-ink-500 transition-colors hover:text-forest-900"
              >
                Clear
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="h-13 flex-1 rounded-full bg-forest-800 py-3.5 text-[16px] font-semibold text-cream-50 shadow-cta transition-transform active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        ) : undefined
      }
    >
      {hint ? <p className="mb-3 text-[13px] text-ink-500">{hint}</p> : null}
      <ul className="flex flex-col gap-2 pb-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => toggle(option.id)}
                aria-pressed={isSelected}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-medium transition-colors ${
                  isSelected
                    ? "bg-forest-800 text-cream-50"
                    : "bg-white text-forest-900 edge-soft hover:bg-cream-100"
                }`}
              >
                {option.label}
                <span
                  className={`grid size-5 place-items-center rounded-full border transition-colors ${
                    isSelected
                      ? "border-cream-50 bg-cream-50 text-forest-800"
                      : "border-cream-400 text-transparent"
                  }`}
                >
                  <Check size={13} strokeWidth={3} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
