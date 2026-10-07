"use client";

import { AnimatePresence, motion } from "framer-motion";
import { UtensilsCrossed } from "lucide-react";
import { useEffect, useState } from "react";
import { PLATING_STEPS } from "@/lib/prompts";

interface PlatingOverlayProps {
  show: boolean;
  /** Shortened for a "New Menu" reshuffle versus a first search. */
  compact?: boolean;
}

export function PlatingOverlay({ show, compact = false }: PlatingOverlayProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!show) {
      setStep(0);
      return;
    }
    const interval = setInterval(
      () => setStep((current) => Math.min(current + 1, PLATING_STEPS.length - 1)),
      compact ? 220 : 330
    );
    return () => clearInterval(interval);
  }, [show, compact]);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="relative grid size-24 place-items-center">
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-dashed border-forest-200"
              animate={{ rotate: 360 }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
            />
            <motion.span
              className="absolute inset-2 rounded-full bg-forest-800"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <UtensilsCrossed size={30} strokeWidth={2} className="relative text-cream-50" />
          </div>

          <div className="h-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="text-[15px] font-medium text-ink-500"
              >
                {PLATING_STEPS[step]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
