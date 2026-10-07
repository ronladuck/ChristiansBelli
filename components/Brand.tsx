import { UtensilsCrossed } from "lucide-react";

interface BrandProps {
  /** "light" for dark backgrounds, "dark" for cream backgrounds. */
  tone?: "light" | "dark";
  size?: "sm" | "md";
}

export function Brand({ tone = "dark", size = "md" }: BrandProps) {
  const isLight = tone === "light";
  return (
    <span className="inline-flex flex-col items-start gap-[3px]" aria-label="Menu">
      <span className="inline-flex items-center gap-1.5">
        <UtensilsCrossed
          size={size === "sm" ? 15 : 17}
          strokeWidth={2.1}
          className={isLight ? "text-cream-100" : "text-forest-800"}
        />
        <span
          className={`font-display font-bold uppercase ${
            size === "sm" ? "text-[15px]" : "text-[17px]"
          } tracking-[0.16em] ${isLight ? "text-cream-50" : "text-forest-900"}`}
        >
          Menu
        </span>
      </span>
      {/* Hand-drawn gold underline — the one piece of brand warmth in the mark. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 72 5"
        className={size === "sm" ? "h-[4px] w-[58px]" : "h-[5px] w-[68px]"}
        fill="none"
      >
        <path
          d="M1 3.2C13 1.4 26.5 1 36 1.4 45.5 1.8 59 2.6 71 1.6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-gold-400"
        />
      </svg>
    </span>
  );
}
