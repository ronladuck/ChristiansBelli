"use client";

import type { VisitRating } from "@/lib/types";

export const RATING_CHOICES: { id: VisitRating; emoji: string; label: string }[] = [
  { id: "disliked", emoji: "😕", label: "Not for me" },
  { id: "okay", emoji: "😐", label: "It was okay" },
  { id: "liked", emoji: "🙂", label: "Liked it" },
  { id: "loved", emoji: "😍", label: "Loved it" },
];

interface RatingPickerProps {
  value: VisitRating | null;
  onChange: (rating: VisitRating) => void;
  /** "tile" stacks the emoji over the label; "compact" sits inline on a card. */
  size?: "tile" | "compact";
}

export function RatingPicker({ value, onChange, size = "tile" }: RatingPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {RATING_CHOICES.map((choice) => {
        const selected = value === choice.id;
        return (
          <button
            key={choice.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(choice.id)}
            className={`flex flex-col items-center gap-1 rounded-2xl transition-all duration-150 active:scale-[0.96] ${
              size === "tile" ? "px-1 py-3" : "px-1 py-2"
            } ${
              selected
                ? "bg-forest-800 text-cream-50 shadow-warm"
                : "bg-white text-ink-700 edge-soft hover:bg-cream-100"
            }`}
          >
            <span className={size === "tile" ? "text-[22px]" : "text-[18px]"} aria-hidden="true">
              {choice.emoji}
            </span>
            <span
              className={`text-center leading-tight font-medium ${
                size === "tile" ? "text-[11.5px]" : "text-[10.5px]"
              }`}
            >
              {choice.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
