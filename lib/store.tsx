"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { VisitRating, VisitRecord } from "./types";

const STORAGE_KEY = "menu.visits.v1";

interface HistoryValue {
  visits: VisitRecord[];
  /** False until localStorage has been read, so the UI can avoid hydration flicker. */
  hydrated: boolean;
  isVisited: (restaurantId: string) => boolean;
  getVisit: (restaurantId: string) => VisitRecord | undefined;
  markVisited: (restaurantId: string) => void;
  rateVisit: (restaurantId: string, rating: VisitRating) => void;
  removeVisit: (restaurantId: string) => void;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryValue | null>(null);

function readStored(): VisitRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as VisitRecord[]) : [];
  } catch {
    return [];
  }
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setVisits(readStored());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
    } catch {
      // Private browsing or a full quota — history just won't persist.
    }
  }, [visits, hydrated]);

  const markVisited = useCallback((restaurantId: string) => {
    setVisits((current) =>
      current.some((v) => v.restaurantId === restaurantId)
        ? current
        : [...current, { restaurantId, rating: null, visitedAt: Date.now() }]
    );
  }, []);

  const rateVisit = useCallback((restaurantId: string, rating: VisitRating) => {
    setVisits((current) => {
      const existing = current.find((v) => v.restaurantId === restaurantId);
      if (!existing) {
        return [...current, { restaurantId, rating, visitedAt: Date.now() }];
      }
      return current.map((v) => (v.restaurantId === restaurantId ? { ...v, rating } : v));
    });
  }, []);

  const removeVisit = useCallback((restaurantId: string) => {
    setVisits((current) => current.filter((v) => v.restaurantId !== restaurantId));
  }, []);

  const clearHistory = useCallback(() => setVisits([]), []);

  const value = useMemo<HistoryValue>(
    () => ({
      visits,
      hydrated,
      isVisited: (id) => visits.some((v) => v.restaurantId === id),
      getVisit: (id) => visits.find((v) => v.restaurantId === id),
      markVisited,
      rateVisit,
      removeVisit,
      clearHistory,
    }),
    [visits, hydrated, markVisited, rateVisit, removeVisit, clearHistory]
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryValue {
  const context = useContext(HistoryContext);
  if (!context) throw new Error("useHistory must be used inside HistoryProvider");
  return context;
}

// ───────────────────────── per-search session memory ─────────────────────────

/**
 * Tracks which restaurants a given search has already served, so "New Menu"
 * hands over genuinely different places. Keyed by search signature and scoped to
 * the tab via sessionStorage, so it survives a trip to a detail page.
 */
const SESSION_PREFIX = "menu.session.v1:";

export interface SearchSession {
  seenIds: string[];
  round: number;
}

export function readSession(signature: string): SearchSession {
  if (typeof window === "undefined") return { seenIds: [], round: 0 };
  try {
    const raw = window.sessionStorage.getItem(SESSION_PREFIX + signature);
    if (!raw) return { seenIds: [], round: 0 };
    const parsed = JSON.parse(raw) as SearchSession;
    return {
      seenIds: Array.isArray(parsed.seenIds) ? parsed.seenIds : [],
      round: typeof parsed.round === "number" ? parsed.round : 0,
    };
  } catch {
    return { seenIds: [], round: 0 };
  }
}

export function writeSession(signature: string, session: SearchSession): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_PREFIX + signature, JSON.stringify(session));
  } catch {
    // Non-fatal: New Menu falls back to seeded variation alone.
  }
}
