import type { Variants } from "motion/react";

/** リストのカードを少しずつ遅らせてフェードインさせる（親に listVariants、子に itemVariants） */
export const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035, delayChildren: 0.04 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } },
};

/** 階層を進むときは右から、戻るときは左からスライドする（custom に +1 / -1） */
export const slideVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? "100%" : "-25%", opacity: direction > 0 ? 1 : 0.5, zIndex: direction > 0 ? 2 : 0 }),
  center: { x: 0, opacity: 1, zIndex: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? "-25%" : "100%", opacity: direction > 0 ? 0.5 : 1, zIndex: direction > 0 ? 0 : 2 }),
};

export const SLIDE_TRANSITION = { type: "spring", stiffness: 380, damping: 40, mass: 0.9 } as const;
