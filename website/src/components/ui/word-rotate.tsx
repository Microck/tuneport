"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, HTMLMotionProps, motion } from "motion/react";

import { cn } from "@/lib/utils";

interface WordRotateProps {
  words: string[];
  duration?: number;
  framerProps?: HTMLMotionProps<"span">;
  className?: string;
}

export default function WordRotate({
  words,
  duration = 2500,
  framerProps = {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
    transition: { duration: 0.25, ease: "easeOut" },
  },
  className,
}: WordRotateProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, duration);

    return () => clearInterval(interval);
  }, [words, duration]);

  return (
    <motion.span
      className="overflow-hidden inline-flex"
      layout
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          className={cn(className)}
          {...framerProps}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
