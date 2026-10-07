"use client";

import { motion } from "framer-motion";
import { AppHeader } from "./AppHeader";
import { SearchPanel } from "./SearchPanel";
import { SmartImage } from "./ui/SmartImage";
import { splitHeadline } from "@/lib/prompts";
import type { PhotoKey } from "@/lib/photos";

interface HomeScreenProps {
  /** Chosen per request on the server so the headline rotates every visit. */
  question: string;
  placeholder: string;
  heroPhoto: PhotoKey;
}

export function HomeScreen({ question, placeholder, heroPhoto }: HomeScreenProps) {
  const { head, tail } = splitHeadline(question);

  return (
    <div className="relative min-h-dvh">
      {/* Hero photography: a band on phones, the full canvas on desktop. */}
      <div className="absolute inset-x-0 top-0 h-[56svh] min-h-[330px] lg:inset-0 lg:h-full">
        <SmartImage
          photo={heroPhoto}
          alt=""
          priority
          sizes="100vw"
          className="scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-950/70 via-forest-950/45 to-forest-950/85 lg:bg-forest-950/65" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-page lg:hidden" />
      </div>

      <div className="relative flex min-h-dvh flex-col">
        <AppHeader tone="light" />

        <main className="flex flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-6xl lg:flex-row lg:items-center lg:gap-16 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-[calc(56svh-5.5rem)] flex-col justify-end px-5 pb-7 lg:min-h-0 lg:flex-1 lg:justify-center lg:px-0 lg:pb-0"
          >
            <h1 className="max-w-[18ch] text-[clamp(2.5rem,11vw,3.25rem)] leading-[1.04] font-bold text-cream-50 lg:text-[clamp(3.25rem,5vw,4.5rem)]">
              {head ? <span>{head} </span> : null}
              <span className="text-gold-400">{tail}</span>
            </h1>
            <p className="mt-4 hidden max-w-[34ch] text-[17px] leading-relaxed text-cream-200/85 lg:block">
              Tell us what you want. We&rsquo;ll narrow it down to three — your pick, the best
              overall, and one wild card.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="px-4 pb-8 lg:w-[480px] lg:shrink-0 lg:px-0"
          >
            <SearchPanel placeholder={placeholder} />

            <p className="mx-auto mt-5 max-w-[30ch] text-center text-[13.5px] leading-relaxed text-ink-500 lg:text-cream-200/70">
              Exactly three recommendations. No endless scrolling.
            </p>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
