"use client";

import { useRef, useState } from "react";
import type { PhotoKey } from "@/lib/photos";
import { SmartImage } from "./ui/SmartImage";

interface PhotoCarouselProps {
  photos: PhotoKey[];
  alt: string;
  className?: string;
}

/** Scroll-snap gallery — native momentum on touch, dots for position. */
export function PhotoCarousel({ photos, alt, className = "" }: PhotoCarouselProps) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setActive(Math.max(0, Math.min(photos.length - 1, index)));
  };

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {photos.map((photo, index) => (
          <div key={photo} className="size-full shrink-0 basis-full snap-center">
            <SmartImage
              photo={photo}
              alt={index === 0 ? alt : ""}
              priority={index === 0}
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
        ))}
      </div>

      {photos.length > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center gap-1.5">
          {photos.map((photo, index) => (
            <button
              key={photo}
              type="button"
              aria-label={`Photo ${index + 1}`}
              onClick={() => goTo(index)}
              className={`pointer-events-auto h-1.5 rounded-full transition-all duration-300 ${
                index === active ? "w-5 bg-cream-50" : "w-1.5 bg-cream-50/55"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
