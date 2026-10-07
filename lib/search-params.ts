import { DEFAULT_FILTERS, type SearchFilters } from "./filters";
import type { Dietary, Vibe } from "./types";

/** Short URL keys keep the address bar readable when a menu is shared. */
const KEYS = {
  query: "q",
  distance: "d",
  price: "p",
  excludeVisited: "ex",
  openNow: "on",
  reservations: "rs",
  outdoor: "os",
  dietary: "dt",
  vibes: "vb",
  minRating: "mr",
  cuisine: "c",
} as const;

export function filtersToParams(query: string, filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (query.trim()) params.set(KEYS.query, query.trim());
  if (filters.distanceId !== DEFAULT_FILTERS.distanceId) params.set(KEYS.distance, filters.distanceId);
  if (filters.priceBandIds.length) params.set(KEYS.price, filters.priceBandIds.join(","));
  if (filters.excludeVisited) params.set(KEYS.excludeVisited, "1");
  if (filters.openNow) params.set(KEYS.openNow, "1");
  if (filters.takesReservations) params.set(KEYS.reservations, "1");
  if (filters.outdoorSeating) params.set(KEYS.outdoor, "1");
  if (filters.dietary.length) params.set(KEYS.dietary, filters.dietary.join(","));
  if (filters.vibes.length) params.set(KEYS.vibes, filters.vibes.join(","));
  if (filters.minRatingId !== DEFAULT_FILTERS.minRatingId) params.set(KEYS.minRating, filters.minRatingId);
  if (filters.cuisine.trim()) params.set(KEYS.cuisine, filters.cuisine.trim());
  return params;
}

function splitList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function paramsToFilters(params: URLSearchParams): { query: string; filters: SearchFilters } {
  return {
    query: params.get(KEYS.query) ?? "",
    filters: {
      distanceId: params.get(KEYS.distance) ?? DEFAULT_FILTERS.distanceId,
      priceBandIds: splitList(params.get(KEYS.price)),
      excludeVisited: params.get(KEYS.excludeVisited) === "1",
      openNow: params.get(KEYS.openNow) === "1",
      takesReservations: params.get(KEYS.reservations) === "1",
      outdoorSeating: params.get(KEYS.outdoor) === "1",
      dietary: splitList(params.get(KEYS.dietary)) as Dietary[],
      vibes: splitList(params.get(KEYS.vibes)) as Vibe[],
      minRatingId: params.get(KEYS.minRating) ?? DEFAULT_FILTERS.minRatingId,
      cuisine: params.get(KEYS.cuisine) ?? "",
    },
  };
}

/** Stable key identifying one search, used to scope the "already shown" session. */
export function searchSignature(query: string, filters: SearchFilters): string {
  return filtersToParams(query, filters).toString() || "default";
}
