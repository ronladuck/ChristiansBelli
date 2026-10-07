"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, CircleCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatDistance, formatPricePerPerson } from "@/lib/format";
import { useHistory } from "@/lib/store";
import type { Recommendation } from "@/lib/types";
import { RatingPicker } from "./RatingPicker";
import { ROLE_META, RoleBadge } from "./RoleBadge";
import { SmartImage } from "./ui/SmartImage";
import { StarRating } from "./ui/StarRating";

interface RestaurantCardProps {
  recommendation: Recommendation;
  /** Appended to the detail link so that page can explain the match. */
  searchParams: string;
  index: number;
}

export function RestaurantCard({ recommendation, searchParams, index }: RestaurantCardProps) {
  const { restaurant, role, why } = recommendation;
  const meta = ROLE_META[role];
  const { isVisited, getVisit, markVisited, rateVisit, removeVisit, hydrated } = useHistory();
  const [showRating, setShowRating] = useState(false);

  const visited = hydrated && isVisited(restaurant.id);
  const visit = getVisit(restaurant.id);
  const detailHref = `/restaurant/${restaurant.id}${searchParams ? `?${searchParams}` : ""}`;

  const handleBeenHere = () => {
    if (visited) {
      removeVisit(restaurant.id);
      setShowRating(false);
      return;
    }
    markVisited(restaurant.id);
    setShowRating(true);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col overflow-hidden rounded-bubble border ${meta.edge} ${meta.bg} p-3.5 shadow-warm`}
    >
      <div className="flex items-center justify-between px-1 pt-0.5 pb-2.5">
        <RoleBadge role={role} />
        {visited ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
            <Check size={11} strokeWidth={3} />
            Been here
          </span>
        ) : null}
      </div>

      <Link
        href={detailHref}
        className="group relative block aspect-[16/9] overflow-hidden rounded-[20px] bg-cream-300"
        aria-label={`View ${restaurant.name}`}
      >
        <span className="block size-full transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-[1.04]">
          <SmartImage
            photo={restaurant.photos[0]}
            alt={`${restaurant.name} — ${restaurant.cuisine} in ${restaurant.neighborhood}`}
            priority={index === 0}
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
        </span>
      </Link>

      <div className="flex flex-1 flex-col px-1 pt-3.5">
        <h3 className="font-display text-[21px] leading-tight font-bold text-forest-900">
          <Link href={detailHref}>{restaurant.name}</Link>
        </h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-ink-500">
          <StarRating rating={restaurant.rating} reviewCount={restaurant.reviewCount} />
          <span aria-hidden="true">•</span>
          <span>{restaurant.cuisine}</span>
          <span aria-hidden="true">•</span>
          <span>{formatPricePerPerson(restaurant.pricePerPerson)}</span>
          <span aria-hidden="true">•</span>
          <span>{formatDistance(restaurant.distanceMiles)}</span>
        </div>

        <p className="mt-2.5 text-[13.5px] leading-[1.55] text-ink-700">{why}</p>

        <AnimatePresence initial={false}>
          {showRating && visited ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-2xl bg-white/65 p-3">
                <p className="mb-2 text-center text-[12.5px] font-medium text-ink-700">
                  {visit?.rating ? "Thanks — noted for next time." : "How was it?"}
                </p>
                <RatingPicker
                  size="compact"
                  value={visit?.rating ?? null}
                  onChange={(rating) => rateVisit(restaurant.id, rating)}
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-auto flex items-center gap-2 pt-3.5 pb-0.5">
          <button
            type="button"
            onClick={handleBeenHere}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-3 text-[13.5px] font-semibold transition-all active:scale-[0.97] ${
              visited
                ? "bg-forest-800 text-cream-50"
                : "bg-white/80 text-forest-900 edge-soft hover:bg-white"
            }`}
          >
            <CircleCheck size={16} strokeWidth={2.2} />
            {visited ? "Been here" : "I've Been Here"}
          </button>
          <Link
            href={detailHref}
            className="group inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-forest-800 px-3 py-3 text-[13.5px] font-semibold text-cream-50 shadow-warm transition-all active:scale-[0.97]"
          >
            View Restaurant
            <ArrowRight
              size={15}
              strokeWidth={2.4}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
