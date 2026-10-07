"use client";

import { motion } from "framer-motion";
import { Info, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildSearchSummary } from "@/lib/format";
import { buildMenu, type Menu } from "@/lib/recommend";
import { filtersToParams, paramsToFilters, searchSignature } from "@/lib/search-params";
import { readSession, useHistory, writeSession } from "@/lib/store";
import type { VisitRecord } from "@/lib/types";
import { AppHeader } from "./AppHeader";
import { PlatingOverlay } from "./PlatingOverlay";
import { RestaurantCard } from "./RestaurantCard";
import { SearchPanel } from "./SearchPanel";
import { BottomSheet } from "./ui/BottomSheet";

/**
 * Replays every earlier round so the current menu can be rebuilt exactly,
 * while still excluding everything the user has already been shown.
 */
function menuForRound(
  query: string,
  filters: ReturnType<typeof paramsToFilters>["filters"],
  visits: VisitRecord[],
  targetRound: number
): Menu {
  const seen: string[] = [];
  let menu = buildMenu({ query, filters, visits, excludeIds: [], round: 0 });
  for (let round = 0; round <= targetRound; round++) {
    menu = buildMenu({ query, filters, visits, excludeIds: [...seen], round });
    if (round < targetRound) {
      seen.push(...menu.recommendations.map((r) => r.restaurant.id));
    }
  }
  return menu;
}

export function MenuView() {
  const searchParams = useSearchParams();
  const { visits, hydrated } = useHistory();

  const { query, filters } = useMemo(
    () => paramsToFilters(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );
  const signature = useMemo(() => searchSignature(query, filters), [query, filters]);
  const paramString = useMemo(() => filtersToParams(query, filters).toString(), [query, filters]);

  const [round, setRound] = useState(0);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [plating, setPlating] = useState(true);
  const [reshuffling, setReshuffling] = useState(false);
  const [editing, setEditing] = useState(false);

  // Held in a ref so rating a restaurant mid-session doesn't reshuffle the
  // menu the user is currently looking at.
  const visitsRef = useRef<VisitRecord[]>(visits);
  visitsRef.current = visits;

  // Restore which round this search was on, so returning from a detail page
  // shows the same three places.
  useEffect(() => {
    if (!hydrated) return;
    setRound(readSession(signature).round);
  }, [signature, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const built = menuForRound(query, filters, visitsRef.current, round);
    setMenu(built);
    writeSession(signature, {
      round,
      seenIds: built.recommendations.map((r) => r.restaurant.id),
    });

    const delay = round === 0 ? 1150 : 650;
    const timer = setTimeout(() => {
      setPlating(false);
      setReshuffling(false);
    }, delay);
    return () => clearTimeout(timer);
    // `visits` is intentionally excluded — see visitsRef above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, round, hydrated]);

  const summary = useMemo(
    () => (menu ? buildSearchSummary(menu.parsed, filters) : []),
    [menu, filters]
  );

  const newMenu = () => {
    setReshuffling(true);
    setRound((current) => current + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-dvh">
      <PlatingOverlay show={plating || reshuffling} compact={round > 0} />

      <AppHeader solid showBack />

      <main className="mx-auto w-full max-w-[520px] px-5 pb-10 lg:max-w-6xl lg:px-10">
        <div className="pt-3 pb-5 text-center lg:pt-8">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[34px] leading-none font-bold text-forest-900 lg:text-[48px]"
          >
            Your Menu
          </motion.h1>

          {summary.length ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mx-auto mt-2.5 flex max-w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-1 rounded-full px-3 py-1 text-[13px] text-ink-500 transition-colors hover:bg-cream-200 hover:text-forest-900"
            >
              {summary.map((part, index) => (
                <span key={part} className="inline-flex items-center gap-1.5">
                  {index > 0 ? <span aria-hidden="true">•</span> : null}
                  {part}
                </span>
              ))}
              <SlidersHorizontal size={13} strokeWidth={2.2} className="ml-0.5 opacity-70" />
            </button>
          ) : null}

          {query.trim() ? (
            <p className="mx-auto mt-2 max-w-[40ch] text-[13px] leading-relaxed text-ink-400 italic">
              &ldquo;{query.trim()}&rdquo;
            </p>
          ) : null}
        </div>

        {menu?.notes.length ? (
          <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-best-edge bg-best-bg px-4 py-3">
            <Info size={16} strokeWidth={2.2} className="mt-0.5 shrink-0 text-best-ink" />
            <div className="flex flex-col gap-1">
              {menu.notes.map((note) => (
                <p key={note} className="text-[13px] leading-relaxed text-ink-700">
                  {note}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {menu && menu.recommendations.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            key={round}
            className="grid gap-4 lg:grid-cols-3 lg:items-stretch lg:gap-5"
          >
            {menu?.recommendations.map((recommendation, index) => (
              <RestaurantCard
                key={`${round}-${recommendation.restaurant.id}`}
                recommendation={recommendation}
                searchParams={paramString}
                index={index}
              />
            ))}
          </div>
        )}

        {menu && menu.recommendations.length > 0 ? (
          <div className="mt-7">
            <button
              type="button"
              onClick={newMenu}
              className="group flex w-full items-center justify-center gap-2.5 rounded-full bg-forest-800 py-4.5 text-[17px] font-semibold text-cream-50 shadow-cta transition-transform active:scale-[0.98] lg:mx-auto lg:max-w-[380px]"
            >
              <RotateCcw
                size={19}
                strokeWidth={2.3}
                className="transition-transform duration-500 group-hover:-rotate-180"
              />
              New Menu
            </button>
            <p className="mt-2.5 text-center text-[13px] text-ink-500">
              Get 3 new restaurants based on the same request
            </p>
          </div>
        ) : null}
      </main>

      <BottomSheet open={editing} onClose={() => setEditing(false)} title="Adjust your request">
        <div className="pb-2">
          <SearchPanel
            placeholder="Describe what you're after…"
            initialQuery={query}
            initialFilters={filters}
            variant="edit"
            onSubmitted={() => setEditing(false)}
          />
        </div>
      </BottomSheet>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-bubble border border-cream-300 bg-cream-50 px-6 py-12 text-center">
      <p className="text-[40px]" aria-hidden="true">
        🍽️
      </p>
      <h2 className="mt-2 font-display text-[22px] font-bold text-forest-900">
        Nothing matched that one
      </h2>
      <p className="mx-auto mt-2 max-w-[34ch] text-[14px] leading-relaxed text-ink-500">
        Your filters are a little too tight. Try widening the distance or loosening the price range.
      </p>
    </div>
  );
}
