import type { PhotoKey } from "./photos";

export type Vibe =
  | "casual"
  | "date night"
  | "group friendly"
  | "quick bite"
  | "fine dining"
  | "good for drinks"
  | "quiet"
  | "lively"
  | "family friendly"
  | "cozy"
  | "trendy"
  | "classic"
  | "romantic"
  | "late night"
  | "scenic";

export type Dietary = "vegetarian" | "vegan" | "gluten-free" | "dairy-free" | "nut-free" | "halal";

export type MealPeriod = "breakfast" | "brunch" | "lunch" | "dinner" | "late night";

export interface Dish {
  name: string;
  photo: PhotoKey;
  /** Short note shown under the dish name on the detail page. */
  note?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  /** Primary cuisine, shown in the meta row. */
  cuisine: string;
  /** Extra cuisine terms used for matching only (e.g. "pizza", "trattoria"). */
  cuisineTags: string[];
  neighborhood: string;
  city: string;
  address: string;
  /** 0–5, one decimal. */
  rating: number;
  reviewCount: number;
  /** Estimated average spend per person, in USD. */
  pricePerPerson: number;
  distanceMiles: number;
  photos: PhotoKey[];
  dishes: Dish[];
  vibes: Vibe[];
  dietary: Dietary[];
  /** Dish and ingredient keywords the kitchen is known for; drives query matching. */
  knownFor: string[];
  /** One-line editorial summary. */
  blurb: string;
  openNow: boolean;
  takesReservations: boolean;
  outdoorSeating: boolean;
  mealPeriods: MealPeriod[];
  hours: string;
  website: string;
  phone: string;
  /** Present when the restaurant accepts online bookings. */
  reservationUrl?: string;
}

export type RecommendationRole = "pick" | "best" | "wild";

export interface Recommendation {
  restaurant: Restaurant;
  role: RecommendationRole;
  /** AI-style sentence(s) explaining the selection. */
  why: string;
  /** Short matched-signal labels, e.g. "Great pasta", "Fits your budget". */
  highlights: string[];
}

export type VisitRating = "disliked" | "okay" | "liked" | "loved";

export interface VisitRecord {
  restaurantId: string;
  rating: VisitRating | null;
  /** Epoch ms. */
  visitedAt: number;
}
