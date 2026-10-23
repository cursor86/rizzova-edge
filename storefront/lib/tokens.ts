import type { Transition } from "motion/react";

/**
 * Design tokens: "dark glass" surfaces with neo-brutalist accents (hard offset shadows, heavy borders on actions).
 * CSS variables live in app/globals.css (@theme); these mirror them for JS-driven motion.
 */
export const glass = {
  blur: { sm: 8, md: 16, lg: 28 },           // px, backdrop-filter
  fill: { low: 0.04, mid: 0.07, high: 0.12 }, // white alpha on panels
  border: { soft: 0.1, strong: 0.22 },        // white alpha on hairlines
} as const;

export const radius = { chip: 999, card: 22, panel: 28, control: 14 } as const;

export const brutal = {
  shadowOffset: 5, // px, hard shadow on primary actions
  borderWidth: 2,
} as const;

export const spring = {
  /** UI controls: fast, no overshoot. */
  snappy: { type: "spring", stiffness: 520, damping: 38, mass: 0.7 },
  /** Cards and panels: soft settle. */
  soft: { type: "spring", stiffness: 260, damping: 28, mass: 0.9 },
  /** Badges and counters: a little bounce. */
  pop: { type: "spring", stiffness: 700, damping: 18, mass: 0.6 },
} as const satisfies Record<string, Transition>;

export const durations = { fast: 0.15, base: 0.25, slow: 0.45 } as const;
