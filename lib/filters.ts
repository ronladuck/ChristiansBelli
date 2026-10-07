import type { Dietary, Vibe } from "./types";

export interface DistanceOption {
  id: string;
  label: string;
  miles: number;
}

export const DISTANCE_OPTIONS: DistanceOption[] = [
  { id: "1", label: "Within 1 mile", miles: 1 },
  { id: "2", label: "Within 2 miles", miles: 2 },
  { id: "5", label: "Within 5 miles", miles: 5 },
  { id: "10", label: "Within 10 miles", miles: 10 },
  { id: "25", label: "Within 25 miles", miles: 25 },
];

export const DEFAULT_DISTANCE_ID = "5";

export interface PriceBand {
  id: string;
  label: string;
  min: number;
  /** Infinity for the open-ended top band. */
  max: number;
}

/** Estimated average spend per person, not $/$$/$$$. */
export const PRICE_BANDS: PriceBand[] = [
  { id: "u15", label: "Under $15", min: 0, max: 15 },
  { id: "15-30", label: "$15–$30", min: 15, max: 30 },
  { id: "30-50", label: "$30–$50", min: 30, max: 50 },
  { id: "50-75", label: "$50–$75", min: 50, max: 75 },
  { id: "75-100", label: "$75–$100", min: 75, max: 100 },
  { id: "100plus", label: "$100+", min: 100, max: Infinity },
];

export const PRICE_BANDS_BY_ID: Record<string, PriceBand> = Object.fromEntries(
  PRICE_BANDS.map((b) => [b.id, b])
);

export const DIETARY_OPTIONS: { id: Dietary; label: string }[] = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-free" },
  { id: "dairy-free", label: "Dairy-free" },
  { id: "nut-free", label: "Nut-free" },
  { id: "halal", label: "Halal" },
];

/**
 * Secondary vibe chips. The search box is the primary way to express these —
 * these exist only as an optional shortcut inside More Filters.
 */
export const VIBE_OPTIONS: { id: Vibe; label: string }[] = [
  { id: "casual", label: "Casual" },
  { id: "date night", label: "Date night" },
  { id: "group friendly", label: "Group friendly" },
  { id: "quick bite", label: "Quick bite" },
  { id: "fine dining", label: "Fine dining" },
  { id: "good for drinks", label: "Good for drinks" },
  { id: "quiet", label: "Quiet" },
  { id: "lively", label: "Lively" },
  { id: "family friendly", label: "Family friendly" },
];

export const RATING_OPTIONS = [
  { id: "0", label: "Any", min: 0 },
  { id: "3.5", label: "3.5+", min: 3.5 },
  { id: "4", label: "4.0+", min: 4 },
  { id: "4.5", label: "4.5+", min: 4.5 },
];

export interface SearchFilters {
  distanceId: string;
  /** Selected price band ids; empty means no price constraint. */
  priceBandIds: string[];
  excludeVisited: boolean;
  openNow: boolean;
  takesReservations: boolean;
  outdoorSeating: boolean;
  dietary: Dietary[];
  vibes: Vibe[];
  minRatingId: string;
  /** Optional cuisine nudge from More Filters. */
  cuisine: string;
}

export const DEFAULT_FILTERS: SearchFilters = {
  distanceId: DEFAULT_DISTANCE_ID,
  priceBandIds: [],
  excludeVisited: false,
  openNow: false,
  takesReservations: false,
  outdoorSeating: false,
  dietary: [],
  vibes: [],
  minRatingId: "0",
  cuisine: "",
};

export function distanceMiles(filters: SearchFilters): number {
  return DISTANCE_OPTIONS.find((o) => o.id === filters.distanceId)?.miles ?? 5;
}

export function distanceLabel(filters: SearchFilters): string {
  return DISTANCE_OPTIONS.find((o) => o.id === filters.distanceId)?.label ?? "Within 5 miles";
}

export function minRating(filters: SearchFilters): number {
  return RATING_OPTIONS.find((o) => o.id === filters.minRatingId)?.min ?? 0;
}

/** Formats a dollar amount with no cents and no trailing zeros. */
function money(n: number): string {
  return `$${Math.round(n)}`;
}

/**
 * Collapses selected price bands into one readable label. Contiguous bands merge
 * into a single span ("$15–$30" + "$30–$50" reads as "$15–$50"); gaps fall back
 * to a count.
 */
export function priceLabel(priceBandIds: string[]): string {
  if (priceBandIds.length === 0) return "Any price";

  const selected = PRICE_BANDS.filter((b) => priceBandIds.includes(b.id)).sort(
    (a, b) => a.min - b.min
  );
  if (selected.length === 0) return "Any price";

  const indexes = selected.map((b) => PRICE_BANDS.indexOf(b));
  const contiguous = indexes.every((idx, i) => i === 0 || idx === indexes[i - 1] + 1);

  if (!contiguous) return `${selected.length} price ranges`;

  const first = selected[0];
  const last = selected[selected.length - 1];
  if (selected.length === 1) return first.label;
  if (last.max === Infinity) return `${money(first.min)}+`;
  if (first.min === 0) return `Under ${money(last.max)}`;
  return `${money(first.min)}–${money(last.max)}`;
}

export function priceMatchesBands(pricePerPerson: number, priceBandIds: string[]): boolean {
  if (priceBandIds.length === 0) return true;
  return priceBandIds.some((id) => {
    const band = PRICE_BANDS_BY_ID[id];
    if (!band) return false;
    return pricePerPerson >= band.min && pricePerPerson < band.max;
  });
}

/** Number of non-default selections inside More Filters, for the badge count. */
export function advancedFilterCount(filters: SearchFilters): number {
  return (
    (filters.openNow ? 1 : 0) +
    (filters.takesReservations ? 1 : 0) +
    (filters.outdoorSeating ? 1 : 0) +
    filters.dietary.length +
    filters.vibes.length +
    (filters.minRatingId !== "0" ? 1 : 0) +
    (filters.cuisine.trim() ? 1 : 0)
  );
}
