"use client";

import { ArrowRight, CircleSlash2, DollarSign, MapPin, Shuffle, SlidersHorizontal, UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  DEFAULT_FILTERS,
  DISTANCE_OPTIONS,
  PRICE_BANDS,
  advancedFilterCount,
  distanceLabel,
  priceLabel,
  type SearchFilters,
} from "@/lib/filters";
import { SURPRISE_QUERIES, pickRandom } from "@/lib/prompts";
import { filtersToParams } from "@/lib/search-params";
import { MoreFiltersSheet } from "./MoreFiltersSheet";
import { OptionSheet } from "./OptionSheet";
import { FieldRow } from "./ui/FieldRow";
import { Toggle } from "./ui/Toggle";

interface SearchPanelProps {
  placeholder: string;
  initialQuery?: string;
  initialFilters?: SearchFilters;
  /** "edit" is used when revising an existing search from the results page. */
  variant?: "home" | "edit";
  onSubmitted?: () => void;
}

type SheetName = "distance" | "price" | "more" | null;

export function SearchPanel({
  placeholder,
  initialQuery = "",
  initialFilters = DEFAULT_FILTERS,
  variant = "home",
  onSubmitted,
}: SearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Grow the box with the request instead of scrolling a tiny field.
  useLayoutEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
  }, [query]);

  const submit = useCallback(
    (overrideQuery?: string) => {
      const finalQuery = (overrideQuery ?? query).trim();
      setSubmitting(true);
      const params = filtersToParams(finalQuery, filters);
      router.push(`/menu?${params.toString()}`);
      onSubmitted?.();
    },
    [query, filters, router, onSubmitted]
  );

  const surprise = () => {
    const randomQuery = pickRandom(SURPRISE_QUERIES);
    setQuery(randomQuery);
    submit(randomQuery);
  };

  const advancedCount = advancedFilterCount(filters);

  return (
    <div className="rounded-[28px] bg-cream-50 p-4 shadow-warm-lg sm:p-5">
      <label className="sr-only" htmlFor="search-request">
        Describe what you want to eat
      </label>
      <textarea
        id="search-request"
        ref={textareaRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        rows={3}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl bg-cream-200/70 px-4 py-3.5 text-[15px] leading-relaxed text-forest-900 outline-none transition-shadow placeholder:text-ink-400 focus:bg-cream-200 focus:ring-2 focus:ring-forest-300"
      />

      <div className="mt-3 flex flex-col gap-2">
        <FieldRow
          icon={<MapPin size={17} strokeWidth={2.1} />}
          label={distanceLabel(filters)}
          onClick={() => setSheet("distance")}
        />
        <FieldRow
          icon={<DollarSign size={17} strokeWidth={2.2} />}
          label={priceLabel(filters.priceBandIds)}
          onClick={() => setSheet("price")}
        />
        <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 edge-soft">
          <span className="grid size-6 place-items-center text-forest-700">
            <CircleSlash2 size={17} strokeWidth={2.1} />
          </span>
          <span className="flex-1 text-[15px] font-medium text-forest-900">
            Exclude places I&rsquo;ve been
          </span>
          <Toggle
            checked={filters.excludeVisited}
            onChange={(value) => setFilters((f) => ({ ...f, excludeVisited: value }))}
            label="Exclude places I've been"
          />
        </div>
        <FieldRow
          icon={<SlidersHorizontal size={17} strokeWidth={2.1} />}
          label="More filters"
          badge={advancedCount || undefined}
          onClick={() => setSheet("more")}
        />
      </div>

      <button
        type="button"
        onClick={() => submit()}
        disabled={submitting}
        className="group mt-4 flex w-full items-center justify-center gap-2.5 rounded-full bg-forest-800 py-4.5 text-[17px] font-semibold text-cream-50 shadow-cta transition-all duration-200 active:scale-[0.98] disabled:opacity-80"
      >
        <UtensilsCrossed size={19} strokeWidth={2.2} />
        {variant === "edit" ? "Update My Menu" : "Find My Food"}
        <ArrowRight
          size={19}
          strokeWidth={2.4}
          className="transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </button>

      <button
        type="button"
        onClick={surprise}
        className="mt-3 flex w-full items-center justify-center gap-1.5 py-1 text-[13.5px] font-medium text-ink-500 transition-colors hover:text-forest-800"
      >
        <Shuffle size={14} strokeWidth={2.2} />
        Not sure? Try a random menu
      </button>

      <OptionSheet
        open={sheet === "distance"}
        onClose={() => setSheet(null)}
        title="How far can we go?"
        mode="single"
        options={DISTANCE_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
        selected={[filters.distanceId]}
        onChange={(selected) =>
          setFilters((f) => ({ ...f, distanceId: selected[0] ?? f.distanceId }))
        }
      />

      <OptionSheet
        open={sheet === "price"}
        onClose={() => setSheet(null)}
        title="Price per person"
        mode="multi"
        hint="Estimated average spend per person. Pick as many ranges as you like."
        options={PRICE_BANDS.map((b) => ({ id: b.id, label: b.label }))}
        selected={filters.priceBandIds}
        onChange={(selected) => setFilters((f) => ({ ...f, priceBandIds: selected }))}
      />

      <MoreFiltersSheet
        open={sheet === "more"}
        onClose={() => setSheet(null)}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  );
}
