import {
  distanceMiles,
  minRating,
  priceMatchesBands,
  type SearchFilters,
} from "./filters";
import { titleCase } from "./format";
import { parseQuery, type ParsedQuery } from "./query";
import { RESTAURANTS } from "./restaurants";
import type { Recommendation, Restaurant, VisitRecord } from "./types";

// ───────────────────────────── seeded randomness ─────────────────────────────

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small deterministic PRNG so a given query + round always yields the same menu. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ───────────────────────────── taste profile ─────────────────────────────

const RATING_WEIGHT = { loved: 2, liked: 1, okay: 0, disliked: -2 } as const;

export interface TasteProfile {
  cuisineAffinity: Record<string, number>;
  vibeAffinity: Record<string, number>;
  /** Average per-person price of places the user liked or loved. */
  preferredPrice?: number;
  ratedCount: number;
}

export function buildTasteProfile(visits: VisitRecord[]): TasteProfile {
  const cuisineAffinity: Record<string, number> = {};
  const vibeAffinity: Record<string, number> = {};
  const likedPrices: number[] = [];
  let ratedCount = 0;

  for (const visit of visits) {
    if (!visit.rating) continue;
    const restaurant = RESTAURANTS.find((r) => r.id === visit.restaurantId);
    if (!restaurant) continue;

    const weight = RATING_WEIGHT[visit.rating];
    ratedCount++;

    for (const tag of [restaurant.cuisine, ...restaurant.cuisineTags]) {
      cuisineAffinity[tag.toLowerCase()] = (cuisineAffinity[tag.toLowerCase()] ?? 0) + weight;
    }
    for (const vibe of restaurant.vibes) {
      vibeAffinity[vibe] = (vibeAffinity[vibe] ?? 0) + weight;
    }
    if (weight > 0) likedPrices.push(restaurant.pricePerPerson);
  }

  return {
    cuisineAffinity,
    vibeAffinity,
    ratedCount,
    preferredPrice: likedPrices.length
      ? likedPrices.reduce((a, b) => a + b, 0) / likedPrices.length
      : undefined,
  };
}

/** The two or three traits the profile leans hardest toward, for explanation copy. */
export function topTasteTraits(profile: TasteProfile): string[] {
  return Object.entries(profile.vibeAffinity)
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([vibe]) => vibe);
}

// ───────────────────────────── scoring ─────────────────────────────

/**
 * Logistical tags that help matching but read badly in a sentence ("known for
 * cheap and takeout") and shouldn't count as a meaningful match on their own.
 */
const NON_COPY_TERMS = new Set([
  "anniversary",
  "bar seating",
  "big groups",
  "big portions",
  "birthday",
  "breakfast",
  "business dinner",
  "byob",
  "cheap",
  "chef-driven",
  "counter seating",
  "date night",
  "family style",
  "fast",
  "fun",
  "gluten-free",
  "groups",
  "halal",
  "hangover",
  "happy hour",
  "healthy",
  "kids",
  "lazy susan",
  "light lunch",
  "loud",
  "lunch",
  "lunch special",
  "macros",
  "meal prep",
  "no reservations",
  "outdoor",
  "quick",
  "seasonal",
  "service",
  "solo dining",
  "special occasion",
  "spicy",
  "sports",
  "sunset",
  "sustainable",
  "takeout",
  "vegan",
  "vegetarian",
  "walk-ins",
  "waterfront",
  "weekend",
]);

interface Scored {
  restaurant: Restaurant;
  /** How well it matches the stated request. */
  relevance: number;
  /** Objective strength: ratings, review volume, relevance. */
  quality: number;
  /** Relevance plus learned taste affinity. */
  personal: number;
  matchedKeywords: string[];
  /** Matched keywords worth quoting — excludes logistical terms like "lunch". */
  strongKeywords: string[];
  matchedVibes: string[];
  cuisineMatched: boolean;
  /** True when the request named a cuisine and this isn't it. */
  cuisineMissed: boolean;
  locationMatched: boolean;
  budgetFits: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function scoreRestaurant(
  restaurant: Restaurant,
  parsed: ParsedQuery,
  filters: SearchFilters,
  profile: TasteProfile,
  jitter: number
): Scored {
  const cuisinePool = [restaurant.cuisine, ...restaurant.cuisineTags].map((c) => c.toLowerCase());

  // Cuisine is the strongest signal in a request like "Italian in Greenwich",
  // so naming one and missing it is penalised rather than merely unrewarded.
  let cuisineScore = 0;
  let cuisineMatched = false;
  parsed.cuisines.forEach((cuisine, index) => {
    if (cuisinePool.includes(cuisine.toLowerCase())) {
      cuisineMatched = true;
      cuisineScore = Math.max(cuisineScore, index === 0 ? 40 : 26);
    }
  });
  if (filters.cuisine.trim()) {
    const wanted = filters.cuisine.trim().toLowerCase();
    if (cuisinePool.some((c) => c.includes(wanted) || wanted.includes(c))) {
      cuisineMatched = true;
      cuisineScore = Math.max(cuisineScore, 34);
    }
  }
  const cuisineRequested = parsed.cuisines.length > 0 || filters.cuisine.trim().length > 0;
  const cuisineMissed = cuisineRequested && !cuisineMatched;

  const locationMatched =
    parsed.locations.includes(restaurant.neighborhood) ||
    parsed.locations.some((loc) => restaurant.city.toLowerCase().includes(loc.toLowerCase()));
  const locationScore = locationMatched ? 18 : 0;

  const requestedVibes = Array.from(new Set([...parsed.vibes, ...filters.vibes]));
  const matchedVibes = requestedVibes.filter((vibe) => restaurant.vibes.includes(vibe));
  const vibeScore = Math.min(16, matchedVibes.length * 5);

  const matchedKeywords = parsed.keywords.filter((keyword) =>
    restaurant.knownFor.some((known) => known.includes(keyword) || keyword.includes(known))
  );
  // "cocktails" or "handmade pasta" say far more than "lunch" or "groups".
  const strongKeywords = matchedKeywords.filter((keyword) => !NON_COPY_TERMS.has(keyword));
  const keywordScore = Math.min(
    24,
    strongKeywords.length * 7 + (matchedKeywords.length - strongKeywords.length) * 2.5
  );

  const mealScore = parsed.mealPeriods.some((m) => restaurant.mealPeriods.includes(m)) ? 6 : 0;

  // Budget: reward landing inside the stated range, penalise overshooting.
  const { min, max, target } = parsed.budget;
  const price = restaurant.pricePerPerson;
  let budgetScore = 0;
  let budgetFits = true;
  if (max !== undefined) {
    if (price <= max) budgetScore += 10;
    else {
      budgetFits = false;
      budgetScore -= Math.min(30, ((price - max) / max) * 45);
    }
  }
  if (min !== undefined && price < min) {
    budgetFits = false;
    budgetScore -= 8;
  }
  if (target !== undefined) {
    budgetScore += clamp(8 - Math.abs(price - target) / 4, -6, 8);
  }

  const ratingScore = clamp(((restaurant.rating - 4.0) / 0.8) * 12, 0, 14);
  const popularityScore = clamp((Math.log10(restaurant.reviewCount) - 2) * 9, 0, 9);
  const proximityScore = clamp(8 - restaurant.distanceMiles * 1.6, 0, 8);

  const cuisinePenalty = cuisineMissed ? -18 : 0;

  const relevance =
    cuisineScore +
    cuisinePenalty +
    locationScore +
    vibeScore +
    keywordScore +
    mealScore +
    budgetScore +
    ratingScore * 0.5 +
    proximityScore +
    jitter;

  // Quality deliberately leans on objective strength — ratings and review volume —
  // so "Best Overall" stays distinct from the request-specific "Your Pick".
  const quality =
    ratingScore * 2.6 +
    popularityScore * 2.2 +
    cuisineScore * 0.6 +
    cuisinePenalty * 1.4 +
    locationScore * 0.35 +
    keywordScore * 0.25 +
    vibeScore * 0.6 +
    mealScore * 0.8 +
    budgetScore * 0.35 +
    proximityScore * 0.2 +
    jitter * 0.6;

  // Personal blends relevance with learned taste.
  let affinity = 0;
  for (const tag of cuisinePool) affinity += (profile.cuisineAffinity[tag] ?? 0) * 2.2;
  for (const vibe of restaurant.vibes) affinity += (profile.vibeAffinity[vibe] ?? 0) * 1.6;
  affinity = clamp(affinity, -30, 30);
  if (profile.preferredPrice !== undefined) {
    affinity += clamp(6 - Math.abs(price - profile.preferredPrice) / 6, -4, 6);
  }

  return {
    restaurant,
    relevance,
    quality,
    personal: relevance + affinity,
    matchedKeywords,
    strongKeywords,
    matchedVibes,
    cuisineMatched,
    cuisineMissed,
    locationMatched,
    budgetFits,
  };
}

// ───────────────────────────── filtering ─────────────────────────────

interface HardFilterOptions {
  maxDistance: number;
  usePriceBands: boolean;
  useMinRating: boolean;
  useAvailabilityToggles: boolean;
  /** Honour a ceiling the user stated in words, e.g. "under $50 each". */
  useStatedBudget: boolean;
  /** Keep a breakfast-only cafe out of a "dinner" request. */
  useMealPeriod: boolean;
}

function passesHardFilters(
  restaurant: Restaurant,
  filters: SearchFilters,
  parsed: ParsedQuery,
  visitedIds: Set<string>,
  options: HardFilterOptions
): boolean {
  if (restaurant.distanceMiles > options.maxDistance) return false;
  if (filters.excludeVisited && visitedIds.has(restaurant.id)) return false;
  if (
    options.useMealPeriod &&
    parsed.mealPeriods.length > 0 &&
    !parsed.mealPeriods.some((period) => restaurant.mealPeriods.includes(period))
  )
    return false;
  if (options.usePriceBands && !priceMatchesBands(restaurant.pricePerPerson, filters.priceBandIds))
    return false;
  if (options.useStatedBudget && parsed.budget.max !== undefined) {
    if (restaurant.pricePerPerson > parsed.budget.max) return false;
  }
  if (options.useStatedBudget && parsed.budget.min !== undefined) {
    if (restaurant.pricePerPerson < parsed.budget.min) return false;
  }
  if (options.useMinRating && restaurant.rating < minRating(filters)) return false;
  if (options.useAvailabilityToggles) {
    if (filters.openNow && !restaurant.openNow) return false;
    if (filters.takesReservations && !restaurant.takesReservations) return false;
    if (filters.outdoorSeating && !restaurant.outdoorSeating) return false;
  }
  // Dietary needs are never relaxed, whether chosen as a filter or typed in
  // the request ("gluten free pizza near me").
  const requiredDietary = new Set([...filters.dietary, ...parsed.dietary]);
  for (const need of requiredDietary) {
    if (!restaurant.dietary.includes(need)) return false;
  }
  return true;
}

/**
 * Cuisines that scratch the same itch. Drives the Wild Card so a pivot stays
 * plausible — Mediterranean for an Italian request, not a burger joint.
 */
const ADJACENT_CUISINES: Record<string, string[]> = {
  Italian: ["Mediterranean", "Pizza", "French", "Spanish", "Greek", "New American"],
  Pizza: ["Italian", "Mediterranean", "American"],
  Mediterranean: ["Greek", "Middle Eastern", "Italian", "Spanish", "Plant-Based"],
  Greek: ["Mediterranean", "Middle Eastern", "Seafood", "Italian"],
  "Middle Eastern": ["Mediterranean", "Greek", "Indian", "Plant-Based"],
  Burgers: ["American", "Diner", "Steakhouse", "Mexican"],
  American: ["Burgers", "Diner", "Steakhouse", "New American", "Seafood"],
  Steakhouse: ["American", "French", "Seafood", "Burgers"],
  Diner: ["American", "Burgers", "Brunch"],
  Healthy: ["Fast Casual", "New American", "Plant-Based", "Vietnamese", "Mediterranean"],
  "Fast Casual": ["Healthy", "Mexican", "Plant-Based"],
  Japanese: ["Sushi", "Ramen", "Korean", "Seafood"],
  Sushi: ["Japanese", "Ramen", "Korean", "Seafood"],
  Ramen: ["Japanese", "Vietnamese", "Chinese", "Korean"],
  Vietnamese: ["Thai", "Ramen", "Chinese", "Healthy"],
  Thai: ["Vietnamese", "Chinese", "Korean", "Indian"],
  Korean: ["Japanese", "Chinese", "Thai", "American"],
  Chinese: ["Thai", "Vietnamese", "Korean", "Ramen"],
  Mexican: ["Fast Casual", "Spanish", "American", "Burgers"],
  French: ["Italian", "Spanish", "New American", "Steakhouse", "Bakery"],
  Spanish: ["French", "Italian", "Mediterranean", "Seafood"],
  Indian: ["Middle Eastern", "Thai", "Plant-Based"],
  Seafood: ["Greek", "Italian", "New American", "Japanese", "Steakhouse"],
  Brunch: ["Bakery", "Diner", "Healthy", "American"],
  Bakery: ["Brunch", "French", "Healthy"],
  "Plant-Based": ["Healthy", "Mediterranean", "New American", "Indian"],
  "New American": ["American", "Seafood", "French", "Healthy", "Italian"],
};

function isAdjacentCuisine(candidate: string, requested: string | undefined): boolean {
  if (!requested) return false;
  if (candidate.toLowerCase() === requested.toLowerCase()) return false;
  return (ADJACENT_CUISINES[requested] ?? []).some(
    (c) => c.toLowerCase() === candidate.toLowerCase()
  );
}

// ───────────────────────────── explanation copy ─────────────────────────────

function joinWords(items: string[], conjunction = "and"): string {
  const list = items.filter(Boolean);
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} ${conjunction} ${list[1]}`;
  return `${list.slice(0, -1).join(", ")} ${conjunction} ${list[list.length - 1]}`;
}

/**
 * "neapolitan pizza and wood-fired pizza" reads like a stutter, so terms that
 * share a head noun collapse to the first one mentioned.
 */
function dropOverlapping(terms: string[]): string[] {
  const kept: string[] = [];
  for (const term of terms) {
    const words = new Set(term.split(" "));
    if (!kept.some((seen) => seen.split(" ").some((word) => words.has(word)))) kept.push(term);
  }
  return kept;
}

function knownForPhrase(scored: Scored, limit = 2): string {
  const appetising = (terms: string[]) => terms.filter((term) => !NON_COPY_TERMS.has(term));

  // Prefer terms the request actually asked about, then fall back to the
  // kitchen's own signatures.
  const matched = appetising(scored.matchedKeywords);
  const fallback = appetising(scored.restaurant.knownFor);
  const ranked = dropOverlapping([...matched, ...fallback.filter((t) => !matched.includes(t))]);
  const chosen = ranked.slice(0, limit);

  return joinWords(chosen.length ? chosen : scored.restaurant.knownFor.slice(0, limit));
}

/** Vibe tags are machine-readable; these read naturally in a sentence. */
const VIBE_ADJECTIVES: Record<string, string> = {
  casual: "casual",
  "date night": "date-night",
  "group friendly": "group-friendly",
  "quick bite": "quick",
  "fine dining": "dressed-up",
  "good for drinks": "drinks-forward",
  quiet: "quiet",
  lively: "lively",
  "family friendly": "family-friendly",
  cozy: "cozy",
  trendy: "buzzy",
  classic: "classic",
  romantic: "romantic",
  "late night": "late-night",
  scenic: "scenic",
};

function adjective(vibe: string): string {
  return VIBE_ADJECTIVES[vibe] ?? vibe;
}

// "but" only earns its place between adjectives that pull in opposite directions,
// which is what makes "cozy but lively" land and "casual but quick" read oddly.
const CALM_ADJECTIVES = new Set(["cozy", "quiet", "classic", "romantic", "dressed-up", "relaxed"]);
const LOUD_ADJECTIVES = new Set(["lively", "buzzy", "late-night", "drinks-forward"]);

/** e.g. "cozy but lively" — the adjective pair used to describe a room. */
function vibePhrase(scored: Scored): string {
  const vibes = (scored.matchedVibes.length ? scored.matchedVibes : scored.restaurant.vibes).map(
    adjective
  );
  const pair = Array.from(new Set(vibes)).slice(0, 2);
  if (pair.length < 2) return pair[0] ?? "relaxed";
  const contrasting =
    (CALM_ADJECTIVES.has(pair[0]) && LOUD_ADJECTIVES.has(pair[1])) ||
    (LOUD_ADJECTIVES.has(pair[0]) && CALM_ADJECTIVES.has(pair[1]));
  return `${pair[0]} ${contrasting ? "but" : "and"} ${pair[1]}`;
}

/** e.g. "casual, lively" — comma-joined, for noun-phrase contexts. */
function roomPhrase(scored: Scored): string {
  const vibes = (scored.matchedVibes.length ? scored.matchedVibes : scored.restaurant.vibes).map(
    adjective
  );
  return joinWords(Array.from(new Set(vibes)).slice(0, 2));
}

/** Correct indefinite article for a following phrase, e.g. "an in-and-out room". */
function article(phrase: string): string {
  return /^[aeiou]/i.test(phrase.trim()) ? "an" : "a";
}

/** True when something concrete matched, licensing confident "exactly what you asked for" copy. */
function hasStrongMatch(scored: Scored): boolean {
  return scored.cuisineMatched || scored.strongKeywords.length > 0;
}

function budgetPhrase(parsed: ParsedQuery, restaurant: Restaurant): string {
  const { max, min, target, implied } = parsed.budget;
  // An inferred budget has no number to quote back, so describe the price instead.
  if (implied) {
    if (max !== undefined) return `comes in at about $${restaurant.pricePerPerson} a head`;
    if (min !== undefined) return `runs about $${restaurant.pricePerPerson} a head, which is the point`;
  }
  if (target !== undefined) return `lands right around your $${target} per person`;
  if (max !== undefined) return `comes in under your $${max} ceiling`;
  return `averages about $${restaurant.pricePerPerson} per person`;
}

function preferenceClause(profile: TasteProfile, scored: Scored): string {
  const traits = topTasteTraits(profile).map(adjective);
  if (traits.length) return `you tend to prefer ${joinWords(traits)} places`;
  const vibes = scored.matchedVibes.slice(0, 2).map(adjective);
  if (vibes.length) return `you asked for somewhere ${joinWords(vibes)}`;
  return "it lines up with what you described";
}

function buildPickWhy(
  scored: Scored,
  parsed: ParsedQuery,
  profile: TasteProfile,
  rand: () => number
): string {
  const { restaurant } = scored;
  const signature = knownForPhrase(scored);

  // Safe in every case: framed as the restaurant's own reputation.
  const variants: string[] = [
    `This is your pick because ${preferenceClause(profile, scored)}, and this spot is especially known for ${signature}. It ${budgetPhrase(
      parsed,
      restaurant
    )} and has the ${vibePhrase(scored)} atmosphere you're looking for.`,
    `We picked this one for you specifically: ${signature}, ${article(
      roomPhrase(scored)
    )} ${roomPhrase(scored)} room, and ${restaurant.distanceMiles} miles from you. It ${budgetPhrase(
      parsed,
      restaurant
    )}.`,
  ];

  // Only claim a close match when something concrete actually matched.
  if (hasStrongMatch(scored)) {
    variants.push(
      `${restaurant.name} is your pick — it lines up almost exactly with what you described. Known for ${signature}, it ${budgetPhrase(
        parsed,
        restaurant
      )} and the room is ${vibePhrase(scored)}.`
    );
  }
  if (profile.ratedCount >= 2) {
    variants.push(
      `Based on the places you've rated, ${restaurant.name} is the closest fit — ${preferenceClause(
        profile,
        scored
      )}, and this one is known for ${signature}.`
    );
  }
  return variants[Math.floor(rand() * variants.length)];
}

function buildBestWhy(scored: Scored, rand: () => number): string {
  const { restaurant } = scored;
  const reviews = restaurant.reviewCount.toLocaleString();
  const area = scored.locationMatched ? restaurant.neighborhood : "the area";
  const signature = knownForPhrase(scored, 1);

  const variants = [
    `One of the highest-rated ${restaurant.cuisine} restaurants in ${area}, with consistently strong reviews for its ${signature}, service and atmosphere.`,
    `On ratings and reviews, nothing in ${area} beats ${restaurant.name} right now — ${restaurant.rating}★ from ${reviews} diners, ${restaurant.distanceMiles} miles away.`,
  ];

  // "exactly what you asked for" is only true when the request matched.
  if (scored.strongKeywords.length > 0) {
    variants.push(
      `The strongest overall match: ${restaurant.rating} stars across ${reviews} reviews, and it delivers exactly the ${signature} you asked for.`
    );
  } else {
    variants.push(
      `The strongest option on the board: ${restaurant.rating} stars across ${reviews} reviews, and it's singled out again and again for its ${signature}.`
    );
  }
  return variants[Math.floor(rand() * variants.length)];
}

function buildWildWhy(
  scored: Scored,
  requestedCuisine: string | undefined,
  rand: () => number
): string {
  const { restaurant } = scored;
  const reviews = restaurant.reviewCount.toLocaleString();
  const signature = knownForPhrase(scored, 2);
  const pivot =
    !!requestedCuisine && restaurant.cuisine.toLowerCase() !== requestedCuisine.toLowerCase();
  const adjacent = isAdjacentCuisine(restaurant.cuisine, requestedCuisine);
  const sharesSomething = adjacent || scored.strongKeywords.length > 0;

  // A cold jump gets honest framing rather than a claim of shared appeal.
  if (pivot && !sharesSomething) {
    const coldVariants = [
      `A complete change of direction — ${restaurant.cuisine}, not ${requestedCuisine}. We're including it because it's one of the best-reviewed rooms in range (${restaurant.rating}★, ${reviews} reviews), and sometimes the right answer isn't the one you asked for.`,
      `Total curveball: ${restaurant.name} is ${restaurant.cuisine}. Nothing like your request, but it's ${restaurant.rating}★ from ${reviews} diners and known for ${signature} — worth a look if you're open to it.`,
    ];
    return coldVariants[Math.floor(rand() * coldVariants.length)];
  }

  const variants: string[] = [
    `A little different from your usual spots, but ${restaurant.name} is a beloved ${restaurant.neighborhood} room known for ${signature} — the same thing you're after, from an angle you probably didn't consider.`,
    `Here's the curveball. ${restaurant.name} pushes slightly outside your request, but it's known for ${signature} and rated ${restaurant.rating}★ by ${reviews} diners — an easy yes.`,
  ];
  if (pivot) {
    variants.unshift(
      `Not quite what you asked for — ${restaurant.name} is ${restaurant.cuisine}, not ${requestedCuisine}. But they're known for ${signature}, which lands in much the same territory.`
    );
  }
  return variants[Math.floor(rand() * variants.length)];
}

function buildHighlights(scored: Scored, parsed: ParsedQuery): string[] {
  const { restaurant } = scored;
  const highlights: string[] = [];

  const knownFor = knownForPhrase(scored, 2);
  if (knownFor) highlights.push(`Known for ${knownFor}`);
  if (scored.cuisineMatched) highlights.push(`${restaurant.cuisine} — exactly what you asked for`);
  if (scored.locationMatched) highlights.push(`Right in ${restaurant.neighborhood}`);
  if (scored.matchedVibes.length) highlights.push(`Feels ${roomPhrase(scored)}`);
  if (scored.budgetFits && (parsed.budget.max || parsed.budget.target)) {
    highlights.push("Fits your budget");
  }
  if (restaurant.rating >= 4.6) highlights.push(`Rated ${restaurant.rating} by ${restaurant.reviewCount.toLocaleString()}`);
  if (restaurant.distanceMiles <= 1.5) highlights.push(`${restaurant.distanceMiles} mi away`);
  if (parsed.partySize && parsed.partySize >= 5 && restaurant.vibes.includes("group friendly")) {
    highlights.push(`Handles a table of ${parsed.partySize}`);
  }

  return highlights.slice(0, 4);
}

// ───────────────────────────── menu assembly ─────────────────────────────

export interface MenuRequest {
  query: string;
  filters: SearchFilters;
  visits: VisitRecord[];
  /** Restaurants already shown in this search session. */
  excludeIds?: string[];
  /** Increments with each "New Menu" press to vary the draw. */
  round?: number;
}

export interface Menu {
  recommendations: Recommendation[];
  /** Human-readable notes about any filter relaxation we had to do. */
  notes: string[];
  /** True when every matching restaurant had already been shown. */
  recycled: boolean;
  parsed: ParsedQuery;
}

export function buildMenu({
  query,
  filters,
  visits,
  excludeIds = [],
  round = 0,
}: MenuRequest): Menu {
  const parsed = parseQuery(query);
  const profile = buildTasteProfile(visits);
  const visitedIds = new Set(visits.map((v) => v.restaurantId));
  const rand = mulberry32(hashString(`${query}|${JSON.stringify(filters)}|${round}`));
  const notes: string[] = [];

  // Progressive relaxation: only loosen constraints if we can't field three.
  // A budget the user stated in words is held onto until the very last stage.
  const baseDistance = distanceMiles(filters);
  const base = {
    usePriceBands: true,
    useMinRating: true,
    useAvailabilityToggles: true,
    useStatedBudget: true,
    useMealPeriod: true,
  };
  const stages: HardFilterOptions[] = [
    { ...base, maxDistance: baseDistance },
    { ...base, maxDistance: baseDistance * 2 },
    { ...base, maxDistance: baseDistance * 2, useMinRating: false },
    { ...base, maxDistance: baseDistance * 2, useMinRating: false, usePriceBands: false },
    {
      ...base,
      maxDistance: Infinity,
      useMinRating: false,
      usePriceBands: false,
      useAvailabilityToggles: false,
    },
    {
      maxDistance: Infinity,
      usePriceBands: false,
      useMinRating: false,
      useAvailabilityToggles: false,
      useStatedBudget: false,
      useMealPeriod: false,
    },
  ];

  let pool: Restaurant[] = [];
  let stageUsed = 0;
  for (let i = 0; i < stages.length; i++) {
    pool = RESTAURANTS.filter((r) => passesHardFilters(r, filters, parsed, visitedIds, stages[i]));
    stageUsed = i;
    if (pool.filter((r) => !excludeIds.includes(r.id)).length >= 3) break;
  }

  const stage = stages[stageUsed];
  if (stage.maxDistance !== baseDistance && Number.isFinite(stage.maxDistance)) {
    notes.push(`Widened the radius to ${stage.maxDistance} miles to find three strong options.`);
  } else if (!Number.isFinite(stage.maxDistance) && stageUsed > 0) {
    notes.push("Relaxed your filters slightly — there wasn't enough nearby to fill a menu.");
  }
  if (!stage.usePriceBands && filters.priceBandIds.length) {
    notes.push("Stretched your price range to keep three real options on the menu.");
  }
  if (!stage.useStatedBudget && parsed.budget.max !== undefined && !parsed.budget.implied) {
    notes.push(
      `Nothing left under $${parsed.budget.max} per person, so we've included a few that run higher.`
    );
  } else if (!stage.useStatedBudget && (parsed.budget.max ?? parsed.budget.min) !== undefined) {
    notes.push("Opened up the price range — there weren't three options left at that level.");
  }

  // Previously-shown places are set aside, then reused only if we'd otherwise run dry.
  let available = pool.filter((r) => !excludeIds.includes(r.id));
  let recycled = false;
  if (available.length < 3) {
    recycled = true;
    available = pool;
    if (pool.length >= 3) {
      notes.push("You've seen every match for this search — here's a fresh shuffle.");
    }
  }

  // If the request named a cuisine, reshuffling the best on-cuisine places beats
  // serving an off-cuisine filler. A burger joint is not a "healthy lunch".
  const requested = parsed.cuisines[0] ?? filters.cuisine.trim();
  if (!recycled && requested) {
    const onCuisine = (list: Restaurant[]) =>
      list.filter(
        (r) =>
          [r.cuisine, ...r.cuisineTags].some((tag) => tag.toLowerCase() === requested.toLowerCase()) ||
          isAdjacentCuisine(r.cuisine, requested)
      );
    // Two are needed to fill Your Pick and Best Overall without pivoting.
    if (onCuisine(available).length < 2 && onCuisine(pool).length >= 2) {
      recycled = true;
      available = pool;
      notes.push(
        `You've seen the best ${titleCase(requested)} options nearby — here's another look at the strongest ones.`
      );
    }
  }

  // Once we're reshuffling a small pool, lean harder on randomness so pressing
  // "New Menu" again still visibly changes the menu.
  const jitterRange = recycled ? 26 : 9;
  const scored = available
    .map((restaurant) =>
      scoreRestaurant(restaurant, parsed, filters, profile, (rand() - 0.5) * jitterRange)
    )
    .sort((a, b) => b.relevance - a.relevance);

  if (scored.length === 0) {
    return { recommendations: [], notes, recycled, parsed };
  }

  const topRelevance = scored[0]?.relevance ?? 0;
  const taken = new Set<string>();
  const take = (candidate: Scored | undefined) => {
    if (!candidate) return undefined;
    taken.add(candidate.restaurant.id);
    return candidate;
  };
  const remaining = () => scored.filter((s) => !taken.has(s.restaurant.id));

  /**
   * Your Pick and Best Overall honour a named cuisine; only the Wild Card is
   * allowed to pivot away from it.
   */
  const preferOnCuisine = (list: Scored[]): Scored[] => {
    if (!requested) return [...list];
    const onCuisine = list.filter(
      (s) => s.cuisineMatched || isAdjacentCuisine(s.restaurant.cuisine, requested)
    );
    return onCuisine.length ? onCuisine : [...list];
  };

  // YOUR PICK goes first — it's the headline recommendation, so it gets first
  // claim on the closest fit. BEST OVERALL then takes the strongest remaining.
  const pick = take(preferOnCuisine(scored).sort((a, b) => b.personal - a.personal)[0]);
  const best = take(preferOnCuisine(remaining()).sort((a, b) => b.quality - a.quality)[0]);

  // WILD CARD — adjacent rather than obvious: reward a cuisine pivot that still
  // shares what the request was actually about.
  const requestedCuisine = parsed.cuisines[0] ?? best?.restaurant.cuisine;
  const alreadyShownCuisines = new Set(
    [best, pick].filter(Boolean).map((s) => s!.restaurant.cuisine.toLowerCase())
  );

  const wild = take(
    [...remaining()]
      .map((candidate) => {
        const cuisine = candidate.restaurant.cuisine;
        const freshCuisine = !alreadyShownCuisines.has(cuisine.toLowerCase());
        const pivotsFromRequest =
          !!requestedCuisine && cuisine.toLowerCase() !== requestedCuisine.toLowerCase();
        const adjacent = isAdjacentCuisine(cuisine, requestedCuisine);

        // A pivot only works if it still plausibly satisfies the request, so
        // reward adjacency and shared signatures, and penalise a cold jump.
        const unrelatedJump = pivotsFromRequest && !adjacent && candidate.matchedKeywords.length === 0;

        const surprise =
          (freshCuisine ? 14 : 0) +
          (adjacent ? 20 : 0) +
          (pivotsFromRequest && adjacent ? 8 : 0) +
          candidate.matchedKeywords.length * 7 +
          (candidate.restaurant.rating >= 4.6 ? 8 : 0) +
          (candidate.relevance >= topRelevance * 0.55 ? 10 : -16) +
          (unrelatedJump ? -30 : 0);

        return { candidate, wildScore: candidate.relevance * 0.5 + surprise };
      })
      .sort((a, b) => b.wildScore - a.wildScore)[0]?.candidate
  );

  // Backfill if the pool was thin, so the user always gets a full menu of three.
  const slots = [pick, best, wild];
  const fallback = remaining();
  for (let i = 0; i < slots.length; i++) {
    if (!slots[i]) slots[i] = take(fallback.shift());
  }

  const roleBuilders = [
    (s: Scored) => buildPickWhy(s, parsed, profile, rand),
    (s: Scored) => buildBestWhy(s, rand),
    (s: Scored) => buildWildWhy(s, requestedCuisine, rand),
  ] as const;
  const roles = ["pick", "best", "wild"] as const;

  const recommendations: Recommendation[] = [];
  slots.forEach((candidate, index) => {
    if (!candidate) return;
    recommendations.push({
      restaurant: candidate.restaurant,
      role: roles[index],
      why: roleBuilders[index](candidate),
      highlights: buildHighlights(candidate, parsed),
    });
  });

  return { recommendations, notes, recycled, parsed };
}

/**
 * Standalone "why it matches" paragraph for the detail page, which may be opened
 * without a surrounding menu context.
 */
export function describeMatch(
  restaurant: Restaurant,
  query: string,
  filters: SearchFilters,
  visits: VisitRecord[]
): { why: string; highlights: string[] } {
  const parsed = parseQuery(query);
  const profile = buildTasteProfile(visits);
  const scored = scoreRestaurant(restaurant, parsed, filters, profile, 0);
  const rand = mulberry32(hashString(`${restaurant.id}|${query}`));
  return {
    why: query.trim()
      ? buildPickWhy(scored, parsed, profile, rand)
      : restaurant.blurb,
    highlights: buildHighlights(scored, parsed),
  };
}
