"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { buildTasteProfile } from "@/lib/recommend";
import { getRestaurant } from "@/lib/restaurants";
import { useHistory } from "@/lib/store";
import { AppHeader } from "./AppHeader";
import { RATING_CHOICES } from "./RatingPicker";
import { SmartImage } from "./ui/SmartImage";

export function TasteProfileScreen() {
  const { visits, hydrated, rateVisit, removeVisit, clearHistory } = useHistory();

  const profile = useMemo(() => buildTasteProfile(visits), [visits]);

  const topCuisines = useMemo(
    () =>
      Object.entries(profile.cuisineAffinity)
        .filter(([, weight]) => weight > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([cuisine]) => cuisine),
    [profile]
  );

  const entries = useMemo(
    () =>
      [...visits]
        .sort((a, b) => b.visitedAt - a.visitedAt)
        .map((visit) => ({ visit, restaurant: getRestaurant(visit.restaurantId) }))
        .filter((entry) => entry.restaurant),
    [visits]
  );

  return (
    <div className="min-h-dvh">
      <AppHeader solid showBack />

      <main className="mx-auto w-full max-w-[520px] px-5 pb-14 lg:max-w-[640px]">
        <div className="pt-3 pb-6">
          <h1 className="font-display text-[34px] leading-none font-bold text-forest-900">
            Your Taste
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
            Every place you mark builds your profile. The more you rate, the sharper{" "}
            <span className="font-medium text-forest-800">Your Pick</span> gets.
          </p>
        </div>

        {hydrated && entries.length > 0 ? (
          <div className="mb-6 grid grid-cols-3 gap-2.5">
            <Stat label="Places" value={String(entries.length)} />
            <Stat label="Rated" value={String(profile.ratedCount)} />
            <Stat
              label="Usual spend"
              value={
                profile.preferredPrice ? `$${Math.round(profile.preferredPrice)}` : "—"
              }
            />
          </div>
        ) : null}

        {hydrated && topCuisines.length ? (
          <section className="mb-6 rounded-[24px] border border-forest-100 bg-forest-50 p-4">
            <h2 className="text-[12px] font-bold tracking-[0.08em] text-forest-700 uppercase">
              You lean toward
            </h2>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {topCuisines.map((cuisine) => (
                <li
                  key={cuisine}
                  className="rounded-full bg-white px-3 py-1.5 text-[12.5px] font-medium text-forest-900 capitalize"
                >
                  {cuisine}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!hydrated ? (
          <div className="h-40 rounded-[24px] skeleton" />
        ) : entries.length === 0 ? (
          <div className="rounded-bubble border border-cream-300 bg-cream-50 px-6 py-12 text-center">
            <p className="text-[38px]" aria-hidden="true">
              🧑‍🍳
            </p>
            <h2 className="mt-2 font-display text-[21px] font-bold text-forest-900">
              No history yet
            </h2>
            <p className="mx-auto mt-2 max-w-[32ch] text-[14px] leading-relaxed text-ink-500">
              Mark a restaurant &ldquo;I&rsquo;ve Been Here&rdquo; and rate it — we&rsquo;ll start
              learning what you actually like.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-full bg-forest-800 px-6 py-3 text-[15px] font-semibold text-cream-50 shadow-cta transition-transform active:scale-[0.98]"
            >
              Find my food
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {entries.map(({ visit, restaurant }) => {
                if (!restaurant) return null;
                const current = RATING_CHOICES.find((choice) => choice.id === visit.rating);
                return (
                  <li
                    key={restaurant.id}
                    className="flex gap-3 rounded-[24px] bg-cream-50 p-3 edge-soft"
                  >
                    <Link
                      href={`/restaurant/${restaurant.id}`}
                      className="size-[72px] shrink-0 overflow-hidden rounded-[16px] bg-cream-300"
                    >
                      <SmartImage photo={restaurant.photos[0]} alt={restaurant.name} sizes="96px" />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/restaurant/${restaurant.id}`} className="min-w-0">
                          <h3 className="truncate font-display text-[17px] font-bold text-forest-900">
                            {restaurant.name}
                          </h3>
                          <p className="truncate text-[12.5px] text-ink-500">
                            {restaurant.cuisine} • {restaurant.neighborhood}
                          </p>
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeVisit(restaurant.id)}
                          aria-label={`Remove ${restaurant.name} from history`}
                          className="grid size-7 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-cream-200 hover:text-terracotta-500"
                        >
                          <Trash2 size={14} strokeWidth={2.2} />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center gap-1">
                        {RATING_CHOICES.map((choice) => (
                          <button
                            key={choice.id}
                            type="button"
                            aria-label={choice.label}
                            aria-pressed={visit.rating === choice.id}
                            title={choice.label}
                            onClick={() => rateVisit(restaurant.id, choice.id)}
                            className={`grid size-8 place-items-center rounded-full text-[16px] transition-all active:scale-90 ${
                              visit.rating === choice.id
                                ? "bg-forest-800 ring-2 ring-forest-800 ring-offset-1"
                                : "bg-cream-200 opacity-55 hover:opacity-100"
                            }`}
                          >
                            <span aria-hidden="true">{choice.emoji}</span>
                          </button>
                        ))}
                        <span className="ml-1 text-[11.5px] font-medium text-ink-400">
                          {current?.label ?? "Not rated"}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={clearHistory}
              className="mx-auto mt-7 block rounded-full px-5 py-2.5 text-[13.5px] font-semibold text-ink-400 transition-colors hover:bg-cream-200 hover:text-terracotta-500"
            >
              Clear all history
            </button>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-cream-50 px-3 py-3.5 text-center edge-soft">
      <p className="font-display text-[22px] leading-none font-bold text-forest-900">{value}</p>
      <p className="mt-1 text-[11.5px] font-medium text-ink-500">{label}</p>
    </div>
  );
}
