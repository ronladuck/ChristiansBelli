import type { ParsedQuery } from "./query";
import { distanceLabel, priceLabel, type SearchFilters } from "./filters";

export function formatDistance(miles: number): string {
  if (miles < 0.2) return "Steps away";
  return `${miles.toFixed(1)} mi`;
}

export function formatPricePerPerson(price: number): string {
  return `~$${price}/person`;
}

export function formatReviewCount(count: number): string {
  return count.toLocaleString();
}

/**
 * The one-line recap shown under "Your Menu", e.g.
 * "Italian • Greenwich • $15–$50 • Within 5 miles".
 */
export function buildSearchSummary(parsed: ParsedQuery, filters: SearchFilters): string[] {
  const parts: string[] = [];

  if (parsed.cuisines.length) parts.push(parsed.cuisines.slice(0, 2).join(" + "));
  else if (filters.cuisine.trim()) parts.push(filters.cuisine.trim());

  if (parsed.locations.length) parts.push(parsed.locations[0]);

  if (filters.priceBandIds.length) {
    parts.push(priceLabel(filters.priceBandIds));
  } else if (parsed.budget.implied) {
    parts.push(parsed.budget.min !== undefined ? "Splurge" : "Cheap");
  } else if (parsed.budget.max !== undefined) {
    parts.push(`Under $${parsed.budget.max}`);
  } else if (parsed.budget.target !== undefined) {
    parts.push(`Around $${parsed.budget.target}`);
  }

  parts.push(distanceLabel(filters));

  if (filters.excludeVisited) parts.push("New to you");

  return parts;
}

export function titleCase(value: string): string {
  return value.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}
