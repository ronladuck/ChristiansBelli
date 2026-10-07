"use client";

import { useEffect, useRef, useState } from "react";
import { PHOTOS, type PhotoKey } from "@/lib/photos";

const WIDTHS = [400, 640, 800, 1200, 1600];

interface SmartImageProps {
  photo: PhotoKey;
  alt: string;
  /** Matches the rendered width so the browser picks a sensible source. */
  sizes?: string;
  className?: string;
  priority?: boolean;
}

/**
 * Unsplash-backed image with a responsive srcset, a shimmer placeholder and a
 * fade-in once decoded — photography is the centrepiece here, so it should never
 * pop in abruptly.
 */
export function SmartImage({
  photo,
  alt,
  sizes = "100vw",
  className = "",
  priority = false,
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const id = PHOTOS[photo];

  // The browser starts fetching from the server-rendered HTML, so a cached or
  // fast image can finish loading before React attaches onLoad.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, [photo]);

  const src = (width: number) =>
    `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=72&w=${width}`;

  return (
    <span className={`relative block size-full overflow-hidden ${loaded ? "" : "skeleton"}`}>
      <img
        ref={imgRef}
        src={src(800)}
        srcSet={WIDTHS.map((w) => `${src(w)} ${w}w`).join(", ")}
        sizes={sizes}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`size-full object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${className}`}
      />
    </span>
  );
}
