import { RESTAURANTS } from "./restaurants";
import type { Dietary, MealPeriod, Vibe } from "./types";

/**
 * Keyword-based stand-in for the eventual LLM query parser. It pulls structured
 * intent out of a conversational request so scoring has something to work with.
 */
export interface ParsedQuery {
  raw: string;
  /** Canonical cuisine names, most confident first. */
  cuisines: string[];
  /** Matched neighborhood names from the dataset. */
  locations: string[];
  vibes: Vibe[];
  /** Dish and attribute keywords that overlap what kitchens are known for. */
  keywords: string[];
  dietary: Dietary[];
  mealPeriods: MealPeriod[];
  /** `implied` marks a budget inferred from words like "cheap", not a stated number. */
  budget: { min?: number; max?: number; target?: number; implied?: boolean };
  partySize?: number;
}

const CUISINE_LEXICON: Record<string, string[]> = {
  Italian: [
    "italian",
    "pasta",
    "trattoria",
    "osteria",
    "cacio e pepe",
    "rigatoni",
    "carbonara",
    "risotto",
    "lasagna",
    "chicken parm",
  ],
  Pizza: ["pizza", "pizzeria", "neapolitan", "slice", "margherita", "pepperoni"],
  Mediterranean: ["mediterranean", "med", "greek", "mezze", "hummus", "falafel", "octopus"],
  Greek: ["greek", "souvlaki", "spanakopita", "gyro"],
  "Middle Eastern": ["middle eastern", "lebanese", "levantine", "shawarma", "kebab", "pita"],
  Burgers: ["burger", "burgers", "cheeseburger", "smash burger", "patty"],
  American: ["american", "pub", "tavern", "gastropub", "wings", "bar food", "comfort food"],
  Steakhouse: ["steak", "steakhouse", "ribeye", "chophouse", "filet", "porterhouse"],
  Diner: ["diner", "greasy spoon", "patty melt"],
  Healthy: [
    "healthy",
    "salad",
    "salads",
    "bowl",
    "bowls",
    "grain bowl",
    "light",
    "clean",
    "juice",
    "smoothie",
    "poke",
  ],
  Japanese: ["japanese", "omakase", "izakaya", "sake"],
  Sushi: ["sushi", "sashimi", "nigiri", "roll", "rolls", "maki"],
  Ramen: ["ramen", "noodle soup", "tonkotsu", "gyoza"],
  Vietnamese: ["vietnamese", "pho", "banh mi", "vermicelli"],
  Thai: ["thai", "pad thai", "curry", "som tum", "tom yum"],
  Korean: ["korean", "kbbq", "korean bbq", "bibimbap", "soju", "bulgogi"],
  Chinese: ["chinese", "szechuan", "sichuan", "dim sum", "dumplings", "dan dan", "mapo"],
  Mexican: ["mexican", "taco", "tacos", "taqueria", "burrito", "margarita", "mezcal", "guac"],
  French: ["french", "bistro", "brasserie", "steak frites", "escargot", "croissant"],
  Spanish: ["spanish", "tapas", "jamon", "paella", "sherry", "pintxos"],
  Indian: ["indian", "biryani", "tikka", "butter chicken", "naan", "masala"],
  Seafood: ["seafood", "oyster", "oysters", "fish", "lobster", "raw bar", "crudo", "clams"],
  Brunch: ["brunch", "breakfast", "pancakes", "eggs", "french toast", "benedict", "waffle"],
  Bakery: ["bakery", "pastry", "croissant", "sourdough", "bread", "coffee", "espresso", "cafe"],
  "Plant-Based": ["vegan", "plant-based", "plant based", "vegetarian restaurant", "meatless"],
  "New American": ["new american", "seasonal", "farm to table", "chef-driven", "tasting menu"],
};

const LOCATION_ALIASES: Record<string, string[]> = {
  Greenwich: ["greenwich ct", "greenwich, ct", "greenwich avenue", "greenwich ave", "greenwich"],
  "Old Greenwich": ["old greenwich", "sound beach", "riverside"],
  "Cos Cob": ["cos cob"],
  SoHo: ["soho", "so-ho", "south of houston"],
  "West Village": ["west village", "greenwich village", "the village", "wv"],
  "East Village": ["east village", "alphabet city", "st marks", "ev"],
  FiDi: ["fidi", "financial district", "wall street", "stone street", "downtown manhattan"],
  Nolita: ["nolita", "mulberry street", "little italy"],
  Tribeca: ["tribeca"],
  Chelsea: ["chelsea", "meatpacking"],
  "Lower East Side": ["lower east side", "les", "orchard street"],
  Williamsburg: ["williamsburg", "wburg", "north brooklyn", "bedford ave"],
  Astoria: ["astoria", "long island city", "lic"],
  Chinatown: ["chinatown"],
  "Murray Hill": ["murray hill", "kips bay", "curry hill"],
};

const VIBE_LEXICON: Record<Vibe, string[]> = {
  casual: ["casual", "laid back", "laid-back", "low key", "chill", "relaxed", "no fuss"],
  "date night": ["date night", "date", "romantic dinner", "anniversary", "just us two", "first date"],
  "group friendly": [
    "group",
    "groups",
    "big group",
    "friends",
    "party of",
    "table for",
    "birthday",
    "celebration",
    "crew",
  ],
  "quick bite": ["quick", "fast", "grab", "in and out", "on the go", "takeout", "quick bite"],
  "fine dining": [
    "fine dining",
    "fancy",
    "upscale",
    "nice restaurant",
    "splurge",
    "special occasion",
    "tasting menu",
    "michelin",
  ],
  "good for drinks": [
    "drinks",
    "cocktails",
    "cocktail",
    "wine",
    "natural wine",
    "beer",
    "bar",
    "martini",
    "negroni",
    "happy hour",
    "mezcal",
    "whiskey",
  ],
  quiet: ["quiet", "intimate", "calm", "low noise", "conversation", "peaceful"],
  lively: ["lively", "loud", "buzzy", "fun", "energetic", "vibey", "vibes", "scene"],
  "family friendly": ["family", "kids", "kid friendly", "children", "with my parents"],
  cozy: ["cozy", "cosy", "warm", "charming", "hole in the wall", "neighborhood spot"],
  trendy: ["trendy", "hip", "cool", "hot new", "buzzy opening", "instagram"],
  classic: ["classic", "old school", "institution", "timeless", "traditional"],
  romantic: ["romantic", "candlelit", "intimate dinner", "proposal"],
  "late night": ["late night", "late", "after midnight", "post drinks", "2am"],
  scenic: ["view", "views", "waterfront", "outdoor", "patio", "rooftop", "sunset", "on the water"],
};

const DIETARY_LEXICON: Record<Dietary, string[]> = {
  vegetarian: ["vegetarian", "veggie", "no meat", "meatless"],
  vegan: ["vegan", "plant-based", "plant based"],
  "gluten-free": ["gluten free", "gluten-free", "gf", "celiac"],
  "dairy-free": ["dairy free", "dairy-free", "lactose", "no cheese"],
  "nut-free": ["nut free", "nut-free", "peanut allergy", "nut allergy"],
  halal: ["halal"],
};

const MEAL_LEXICON: Record<MealPeriod, string[]> = {
  breakfast: ["breakfast", "morning", "early"],
  brunch: ["brunch", "weekend morning"],
  lunch: ["lunch", "midday", "lunchtime"],
  dinner: ["dinner", "tonight", "supper", "evening"],
  "late night": ["late night", "after midnight", "late"],
};

/** Every distinct `knownFor` term in the dataset, longest first for greedy matching. */
const KNOWN_FOR_TERMS: string[] = Array.from(
  new Set(RESTAURANTS.flatMap((r) => r.knownFor))
).sort((a, b) => b.length - a.length);

function matchLexicon<K extends string>(text: string, lexicon: Record<K, string[]>): K[] {
  const hits: { key: K; weight: number }[] = [];
  for (const key of Object.keys(lexicon) as K[]) {
    let best = 0;
    for (const term of lexicon[key]) {
      if (containsTerm(text, term)) best = Math.max(best, term.length);
    }
    if (best > 0) hits.push({ key, weight: best });
  }
  // Longer phrase matches are more specific, so surface them first.
  return hits.sort((a, b) => b.weight - a.weight).map((h) => h.key);
}

/** Word-boundary-aware substring test, so "les" doesn't match "unless". */
function containsTerm(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

function parseBudget(text: string): ParsedQuery["budget"] {
  const budget: ParsedQuery["budget"] = {};

  const range = text.match(/\$\s?(\d{1,4})\s*(?:-|–|—|to)\s*\$?\s?(\d{1,4})/);
  if (range) {
    budget.min = Number(range[1]);
    budget.max = Number(range[2]);
    return budget;
  }

  const under = text.match(/(?:under|below|less than|max|no more than|up to)\s*\$?\s?(\d{1,4})/);
  if (under) {
    budget.max = Number(under[1]);
    return budget;
  }

  const approx = text.match(/(?:around|about|~|roughly|approximately)\s*\$?\s?(\d{1,4})/);
  if (approx) {
    const target = Number(approx[1]);
    budget.target = target;
    budget.max = Math.round(target * 1.4);
    return budget;
  }

  const perPerson = text.match(/\$\s?(\d{1,4})\s*(?:per person|each|a person|\/person|pp\b)/);
  if (perPerson) {
    const target = Number(perPerson[1]);
    budget.target = target;
    budget.max = Math.round(target * 1.25);
    return budget;
  }

  const bare = text.match(/\$\s?(\d{1,4})/);
  if (bare) {
    budget.target = Number(bare[1]);
    return budget;
  }

  if (/\b(cheap|cheap eats|affordable|budget|inexpensive)\b/.test(text)) {
    budget.max = 22;
    budget.implied = true;
  } else if (/\b(splurge|blow out|no budget|money is no object|worth it)\b/.test(text)) {
    budget.min = 55;
    budget.implied = true;
  }

  return budget;
}

function parsePartySize(text: string): number | undefined {
  const words: Record<string, number> = {
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    ten: 10,
    twelve: 12,
  };
  const numeric = text.match(/(?:table for|party of|for)\s+(\d{1,2})\b/);
  if (numeric) return Number(numeric[1]);
  const spelled = text.match(/(?:table for|party of|for)\s+([a-z]+)\b/);
  if (spelled && words[spelled[1]]) return words[spelled[1]];
  return undefined;
}

export function parseQuery(raw: string): ParsedQuery {
  const text = ` ${raw.toLowerCase().trim()} `;

  const locations = (Object.keys(LOCATION_ALIASES) as string[]).filter((name) =>
    LOCATION_ALIASES[name].some((alias) => containsTerm(text, alias))
  );

  // "Greenwich Village" is in Manhattan, not Connecticut — drop the false positive.
  const mentionsVillage = containsTerm(text, "greenwich village");
  const resolvedLocations = mentionsVillage
    ? Array.from(new Set(["West Village", ...locations.filter((l) => l !== "Greenwich")]))
    : locations;

  return {
    raw: raw.trim(),
    cuisines: matchLexicon(text, CUISINE_LEXICON),
    locations: resolvedLocations,
    vibes: matchLexicon(text, VIBE_LEXICON),
    keywords: KNOWN_FOR_TERMS.filter((term) => containsTerm(text, term)),
    dietary: matchLexicon(text, DIETARY_LEXICON),
    mealPeriods: matchLexicon(text, MEAL_LEXICON),
    budget: parseBudget(text),
    partySize: parsePartySize(text),
  };
}

export function isEmptyQuery(parsed: ParsedQuery): boolean {
  return (
    parsed.cuisines.length === 0 &&
    parsed.locations.length === 0 &&
    parsed.vibes.length === 0 &&
    parsed.keywords.length === 0
  );
}
