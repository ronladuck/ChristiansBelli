import type { RecommendationRole } from "@/lib/types";

export const ROLE_META: Record<
  RecommendationRole,
  { label: string; emoji: string; bg: string; edge: string; ink: string }
> = {
  pick: {
    label: "Your Pick",
    emoji: "❤️",
    bg: "bg-pick-bg",
    edge: "border-pick-edge",
    ink: "text-pick-ink",
  },
  best: {
    label: "Best Overall",
    emoji: "🏆",
    bg: "bg-best-bg",
    edge: "border-best-edge",
    ink: "text-best-ink",
  },
  wild: {
    label: "Wild Card",
    emoji: "🎲",
    bg: "bg-wild-bg",
    edge: "border-wild-edge",
    ink: "text-wild-ink",
  },
};

export function RoleBadge({ role }: { role: RecommendationRole }) {
  const meta = ROLE_META[role];
  return (
    <span className={`inline-flex items-center gap-1.5 ${meta.ink}`}>
      <span aria-hidden="true" className="text-[13px] leading-none">
        {meta.emoji}
      </span>
      <span className="text-[12px] font-bold tracking-[0.1em] uppercase">{meta.label}</span>
    </span>
  );
}
