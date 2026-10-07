"use client";

import { motion } from "framer-motion";
import {
  BookmarkPlus,
  CalendarCheck,
  ChevronLeft,
  Clock,
  Globe,
  MapPin,
  Navigation,
  Phone,
  Share2,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { formatDistance } from "@/lib/format";
import { describeMatch } from "@/lib/recommend";
import { paramsToFilters } from "@/lib/search-params";
import { useHistory } from "@/lib/store";
import type { Restaurant } from "@/lib/types";
import { PhotoCarousel } from "./PhotoCarousel";
import { RatingPicker } from "./RatingPicker";
import { SmartImage } from "./ui/SmartImage";
import { StarRating } from "./ui/StarRating";

export function RestaurantDetail({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { visits, getVisit, markVisited, rateVisit, isVisited, hydrated } = useHistory();
  const [saved, setSaved] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const { query, filters } = useMemo(
    () => paramsToFilters(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const match = useMemo(
    () => describeMatch(restaurant, query, filters, visits),
    // Recomputed only when the restaurant or search changes, not on every rating.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [restaurant.id, query, filters]
  );

  const visited = hydrated && isVisited(restaurant.id);
  const visit = getVisit(restaurant.id);

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${restaurant.name}, ${restaurant.address}`
  )}`;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: restaurant.name, text: restaurant.blurb, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareNote("Link copied");
    } catch {
      setShareNote("Couldn't share that");
    }
    setTimeout(() => setShareNote(null), 2000);
  };

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  const overlayButton =
    "grid size-10 place-items-center rounded-full bg-forest-950/35 text-cream-50 backdrop-blur-md transition-colors hover:bg-forest-950/55";

  return (
    <div className="min-h-dvh lg:flex lg:items-start">
      {/* Photography: full-bleed on phones, a sticky column on desktop. */}
      <div className="relative lg:sticky lg:top-0 lg:h-dvh lg:w-1/2 lg:shrink-0">
        <PhotoCarousel
          photos={restaurant.photos}
          alt={`${restaurant.name} — ${restaurant.cuisine} in ${restaurant.neighborhood}`}
          className="h-[46svh] min-h-[280px] lg:h-dvh"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-forest-950/45 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-safe">
          <button type="button" onClick={goBack} aria-label="Go back" className={overlayButton}>
            <ChevronLeft size={21} strokeWidth={2.3} />
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={share} aria-label="Share" className={overlayButton}>
              <Share2 size={18} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={() => setSaved((s) => !s)}
              aria-label={saved ? "Saved" : "Save"}
              aria-pressed={saved}
              className={`${overlayButton} ${saved ? "bg-cream-50/95 text-forest-800" : ""}`}
            >
              <BookmarkPlus size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {shareNote ? (
          <div className="absolute inset-x-0 bottom-14 flex justify-center">
            <span className="rounded-full bg-forest-950/80 px-3.5 py-1.5 text-[12.5px] font-medium text-cream-50 backdrop-blur-md">
              {shareNote}
            </span>
          </div>
        ) : null}
      </div>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 -mt-7 min-h-[60svh] rounded-t-[28px] bg-page px-5 pt-6 pb-12 lg:mt-0 lg:flex-1 lg:rounded-none lg:px-10 lg:pt-14 lg:pb-16"
      >
        <div className="mx-auto w-full max-w-[520px]">
          <h1 className="font-display text-[30px] leading-[1.1] font-bold text-forest-900 lg:text-[40px]">
            {restaurant.name}
          </h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13.5px] text-ink-500">
            <StarRating rating={restaurant.rating} reviewCount={restaurant.reviewCount} verbose />
            <span className="inline-flex items-center gap-1">
              <span aria-hidden="true">~</span>${restaurant.pricePerPerson} per person
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} strokeWidth={2.3} />
              {formatDistance(restaurant.distanceMiles)}
            </span>
          </div>

          <p className="mt-1.5 text-[13.5px] font-medium text-ink-700">
            {restaurant.cuisine} <span className="text-ink-400">•</span> {restaurant.neighborhood},{" "}
            {restaurant.city.split(", ").pop()}
          </p>

          <p className="mt-4 text-[14.5px] leading-[1.6] text-ink-700">{match.why}</p>

          {match.highlights.length ? (
            <ul className="mt-3.5 flex flex-wrap gap-1.5">
              {match.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="rounded-full bg-cream-200 px-2.5 py-1 text-[11.5px] font-medium text-ink-700"
                >
                  {highlight}
                </li>
              ))}
            </ul>
          ) : null}

          {/* Directions / Website / Menu / Reserve */}
          <div className="mt-6 grid grid-cols-4 gap-2">
            <ActionTile
              href={mapsUrl}
              icon={<Navigation size={19} strokeWidth={2.1} />}
              label="Directions"
            />
            <ActionTile
              href={`https://${restaurant.website}`}
              icon={<Globe size={19} strokeWidth={2.1} />}
              label="Website"
            />
            <ActionTile
              href={`https://${restaurant.website}/menu`}
              icon={<UtensilsCrossed size={19} strokeWidth={2.1} />}
              label="Menu"
            />
            <ActionTile
              href={restaurant.reservationUrl}
              icon={<CalendarCheck size={19} strokeWidth={2.1} />}
              label="Reserve"
              disabledNote="Walk-ins only"
            />
          </div>

          {/* Have you been here? */}
          <section className="mt-6 rounded-[24px] border border-forest-100 bg-forest-50 p-4">
            <h2 className="font-display text-[18px] font-bold text-forest-900">
              {visited && visit?.rating ? "Thanks — that helps a lot" : "Have you been here?"}
            </h2>
            <p className="mt-0.5 mb-3 text-[13px] text-ink-500">
              {visited && visit?.rating
                ? "We'll use this to sharpen your next menu."
                : "Help us personalize your picks"}
            </p>
            <RatingPicker
              value={visit?.rating ?? null}
              onChange={(rating) => {
                markVisited(restaurant.id);
                rateVisit(restaurant.id, rating);
              }}
            />
          </section>

          {/* Popular dishes */}
          {restaurant.dishes.length ? (
            <section className="mt-7">
              <h2 className="font-display text-[19px] font-bold text-forest-900">Popular Dishes</h2>
              <ul className="no-scrollbar -mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
                {restaurant.dishes.map((dish) => (
                  <li key={dish.name} className="w-[132px] shrink-0">
                    <div className="aspect-square overflow-hidden rounded-[18px] bg-cream-300">
                      <SmartImage photo={dish.photo} alt={dish.name} sizes="160px" />
                    </div>
                    <p className="mt-2 text-[13px] leading-tight font-semibold text-forest-900">
                      {dish.name}
                    </p>
                    {dish.note ? (
                      <p className="mt-0.5 text-[11.5px] leading-tight text-ink-400">{dish.note}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Practical details */}
          <section className="mt-7 overflow-hidden rounded-[24px] bg-cream-50 edge-soft">
            <DetailRow icon={<MapPin size={16} strokeWidth={2.2} />} value={restaurant.address} />
            <DetailRow
              icon={<Clock size={16} strokeWidth={2.2} />}
              value={restaurant.hours}
              note={restaurant.openNow ? "Open now" : "Closed right now"}
              noteTone={restaurant.openNow ? "open" : "closed"}
            />
            <DetailRow
              icon={<Phone size={16} strokeWidth={2.2} />}
              value={restaurant.phone}
              href={`tel:${restaurant.phone.replace(/[^\d+]/g, "")}`}
            />
          </section>

          <Link
            href={`/menu?${searchParams.toString()}`}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-forest-800 py-4 text-[15.5px] font-semibold text-cream-50 shadow-cta transition-transform active:scale-[0.98]"
          >
            <ChevronLeft size={17} strokeWidth={2.4} />
            Back to your menu
          </Link>
        </div>
      </motion.main>
    </div>
  );
}

function ActionTile({
  href,
  icon,
  label,
  disabledNote,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  disabledNote?: string;
}) {
  const shell =
    "flex flex-col items-center justify-center gap-1.5 rounded-[20px] bg-cream-50 px-1 py-3.5 edge-soft transition-colors";

  if (!href) {
    return (
      <div
        className={`${shell} opacity-45`}
        title={disabledNote}
        aria-disabled="true"
      >
        <span className="text-forest-700">{icon}</span>
        <span className="text-[11px] font-semibold text-ink-700">{label}</span>
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${shell} hover:bg-white active:scale-[0.97]`}
    >
      <span className="text-forest-700">{icon}</span>
      <span className="text-[11px] font-semibold text-ink-700">{label}</span>
    </a>
  );
}

function DetailRow({
  icon,
  value,
  note,
  noteTone,
  href,
}: {
  icon: React.ReactNode;
  value: string;
  note?: string;
  noteTone?: "open" | "closed";
  href?: string;
}) {
  const body = (
    <>
      <span className="mt-0.5 shrink-0 text-ink-400">{icon}</span>
      <span className="flex-1 text-[13.5px] leading-snug text-ink-700">{value}</span>
      {note ? (
        <span
          className={`shrink-0 text-[12px] font-semibold ${
            noteTone === "open" ? "text-forest-500" : "text-terracotta-500"
          }`}
        >
          {note}
        </span>
      ) : null}
    </>
  );

  const shell =
    "flex items-start gap-3 px-4 py-3.5 not-last:border-b not-last:border-cream-300";

  return href ? (
    <a href={href} className={`${shell} transition-colors hover:bg-cream-100`}>
      {body}
    </a>
  ) : (
    <div className={shell}>{body}</div>
  );
}
