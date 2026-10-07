/** Conversational headlines, rotated on each visit to give the product personality. */
export const QUESTIONS = [
  "Where are we eating tonight?",
  "What are we craving?",
  "What're we feasting on today?",
  "What sounds good?",
  "What's for dinner?",
  "What are we in the mood for?",
  "Where are we eating?",
  "What's calling your name?",
  "What are we hungry for?",
  "What should we go get?",
  "What's the move tonight?",
  "Hungry for something good?",
] as const;

/**
 * Last word (or two) gets the gold accent treatment, so each headline needs a
 * split point that reads well.
 */
export function splitHeadline(question: string): { head: string; tail: string } {
  const words = question.trim().split(/\s+/);
  if (words.length <= 2) return { head: "", tail: question };
  const tailLength = words[words.length - 1].length <= 4 ? 2 : 1;
  return {
    head: words.slice(0, words.length - tailLength).join(" "),
    tail: words.slice(words.length - tailLength).join(" "),
  };
}

/** Rotating placeholder examples for the search box. */
export const SEARCH_EXAMPLES = [
  "e.g. Italian in Greenwich, casual date night, great pasta and cocktails, under $50 each",
  "e.g. Burgers in SoHo. Somewhere casual with good drinks",
  "e.g. Healthy lunch near FiDi, around $20 per person",
  "e.g. Sushi for a birthday, lively, somewhere we can get a table for six",
  "e.g. Quiet dinner in the West Village, great wine, nothing too expensive",
  "e.g. Tacos and margaritas, outdoor seating, walking distance",
] as const;

/** One-tap starters offered when the search box is empty. */
export const SURPRISE_QUERIES = [
  "Cozy Italian for date night, great pasta and cocktails",
  "Burgers and good drinks, somewhere casual",
  "Healthy lunch, around $20 per person",
  "Sushi night, lively room, great cocktails",
  "Somewhere outdoors with great seafood and rosé",
  "Ramen or noodles, cheap and fast",
  "Big group dinner, lots of sharing plates",
  "Brunch with incredible pancakes and good coffee",
  "Tacos and mezcal, loud and fun",
  "A really special dinner, worth the splurge",
] as const;

/** Rotating status lines shown while the menu is being assembled. */
export const PLATING_STEPS = [
  "Reading your request…",
  "Shortlisting 400+ nearby spots…",
  "Weighing reviews and your taste…",
  "Plating your menu…",
] as const;

export function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
