import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  /** Adds the word "reviews" after the count, for detail views. */
  verbose?: boolean;
  className?: string;
}

export function StarRating({ rating, reviewCount, verbose, className = "" }: StarRatingProps) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap ${className}`}>
      <Star size={14} className="fill-gold-500 text-gold-500" strokeWidth={0} />
      <span className="font-semibold text-forest-900">{rating.toFixed(1)}</span>
      {reviewCount !== undefined ? (
        <span className="text-ink-500">
          {verbose
            ? `(${reviewCount.toLocaleString()} reviews)`
            : `(${reviewCount.toLocaleString()})`}
        </span>
      ) : null}
    </span>
  );
}
