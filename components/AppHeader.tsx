"use client";

import { ChevronLeft, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "./Brand";

interface AppHeaderProps {
  tone?: "light" | "dark";
  showBack?: boolean;
  /** Where back should land if there's no history to pop. */
  backHref?: string;
  /** Adds a cream background and hairline — used on scrolling pages. */
  solid?: boolean;
}

export function AppHeader({
  tone = "dark",
  showBack = false,
  backHref = "/",
  solid = false,
}: AppHeaderProps) {
  const router = useRouter();
  const isLight = tone === "light";

  const buttonClass = `grid size-10 place-items-center rounded-full transition-colors ${
    isLight
      ? "bg-white/15 text-cream-50 backdrop-blur-md hover:bg-white/25"
      : "bg-white text-forest-800 edge-soft hover:bg-cream-100"
  }`;

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push(backHref);
  };

  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between gap-3 px-5 pt-safe pb-3 ${
        solid ? "border-b border-cream-300/70 bg-page/90 backdrop-blur-xl" : ""
      }`}
    >
      <div className="flex min-w-10 items-center">
        {showBack ? (
          <button type="button" onClick={goBack} aria-label="Go back" className={buttonClass}>
            <ChevronLeft size={21} strokeWidth={2.3} />
          </button>
        ) : (
          <Link href="/" aria-label="Menu home">
            <Brand tone={tone} />
          </Link>
        )}
      </div>

      {showBack ? (
        <Link href="/" aria-label="Menu home">
          <Brand tone={tone} size="sm" />
        </Link>
      ) : null}

      <div className="flex min-w-10 justify-end">
        <Link href="/you" aria-label="Your taste profile" className={buttonClass}>
          <User size={19} strokeWidth={2.1} />
        </Link>
      </div>
    </header>
  );
}
