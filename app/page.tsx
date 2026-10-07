import { HomeScreen } from "@/components/HomeScreen";
import type { PhotoKey } from "@/lib/photos";
import { QUESTIONS, SEARCH_EXAMPLES, pickRandom } from "@/lib/prompts";

/** Dark, atmospheric rooms that hold cream type well. */
const HERO_PHOTOS: PhotoKey[] = [
  "roomWarmBar",
  "roomMoodyBar",
  "roomUpscaleTable",
  "roomDarkWood",
  "roomBottleBar",
  "roomPendantStairs",
];

// Rendered per request so the headline, placeholder and hero rotate on every visit.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <HomeScreen
      question={pickRandom(QUESTIONS)}
      placeholder={pickRandom(SEARCH_EXAMPLES)}
      heroPhoto={pickRandom(HERO_PHOTOS)}
    />
  );
}
