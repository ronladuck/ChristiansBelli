"use client";

import { Clock, Search, Trees, CalendarCheck } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DIETARY_OPTIONS,
  RATING_OPTIONS,
  VIBE_OPTIONS,
  advancedFilterCount,
  type SearchFilters,
} from "@/lib/filters";
import type { Dietary, Vibe } from "@/lib/types";
import { BottomSheet } from "./ui/BottomSheet";
import { Chip } from "./ui/Chip";
import { Toggle } from "./ui/Toggle";

interface MoreFiltersSheetProps {
  open: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h3 className="mb-2.5 text-[13px] font-semibold tracking-[0.06em] text-ink-500 uppercase">
      {children}
    </h3>
  );
}

export function MoreFiltersSheet({ open, onClose, filters, onApply }: MoreFiltersSheetProps) {
  // Edits are staged so closing without applying discards them.
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const update = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const toggleIn = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const count = advancedFilterCount(draft);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="More Filters"
      footer={
        <div className="flex items-center gap-3">
          {count > 0 ? (
            <button
              type="button"
              onClick={() =>
                setDraft({
                  ...draft,
                  openNow: false,
                  takesReservations: false,
                  outdoorSeating: false,
                  dietary: [],
                  vibes: [],
                  minRatingId: "0",
                  cuisine: "",
                })
              }
              className="rounded-full px-4 py-3 text-[15px] font-semibold text-ink-500 transition-colors hover:text-forest-900"
            >
              Reset
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="flex-1 rounded-full bg-forest-800 py-3.5 text-[16px] font-semibold text-cream-50 shadow-cta transition-transform active:scale-[0.98]"
          >
            Apply Filters{count > 0 ? ` (${count})` : ""}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 pb-2">
        <div className="flex flex-col gap-2">
          {(
            [
              { key: "openNow", label: "Open now", icon: <Clock size={17} strokeWidth={2.1} /> },
              {
                key: "takesReservations",
                label: "Accepts reservations",
                icon: <CalendarCheck size={17} strokeWidth={2.1} />,
              },
              {
                key: "outdoorSeating",
                label: "Outdoor seating",
                icon: <Trees size={17} strokeWidth={2.1} />,
              },
            ] as const
          ).map(({ key, label, icon }) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 edge-soft"
            >
              <span className="text-forest-700">{icon}</span>
              <span className="flex-1 text-[15px] font-medium text-forest-900">{label}</span>
              <Toggle checked={draft[key]} onChange={(value) => update(key, value)} label={label} />
            </div>
          ))}
        </div>

        <section>
          <SectionLabel>Dietary Preferences</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                selected={draft.dietary.includes(option.id)}
                onClick={() => update("dietary", toggleIn<Dietary>(draft.dietary, option.id))}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <SectionLabel>Vibe / Occasion</SectionLabel>
          <p className="-mt-1.5 mb-2.5 text-[13px] text-ink-500">
            Optional — describing it in the search box usually works better.
          </p>
          <div className="flex flex-wrap gap-2">
            {VIBE_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                selected={draft.vibes.includes(option.id)}
                onClick={() => update("vibes", toggleIn<Vibe>(draft.vibes, option.id))}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <SectionLabel>Minimum Rating</SectionLabel>
          <div className="flex gap-2">
            {RATING_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={draft.minRatingId === option.id}
                onClick={() => update("minRatingId", option.id)}
                className={`flex-1 rounded-full py-2.5 text-[14px] font-semibold transition-colors ${
                  draft.minRatingId === option.id
                    ? "bg-forest-800 text-cream-50"
                    : "bg-white text-ink-700 edge-soft hover:bg-cream-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionLabel>Cuisine Type (optional)</SectionLabel>
          <div className="flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 edge-soft">
            <Search size={17} strokeWidth={2.2} className="text-ink-400" />
            <input
              type="text"
              value={draft.cuisine}
              onChange={(event) => update("cuisine", event.target.value)}
              placeholder="e.g. Italian, Mexican, Sushi, Burgers…"
              className="w-full bg-transparent text-[15px] text-forest-900 outline-none placeholder:text-ink-400"
            />
          </div>
        </section>
      </div>
    </BottomSheet>
  );
}
