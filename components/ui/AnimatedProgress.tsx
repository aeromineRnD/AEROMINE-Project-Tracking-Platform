"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  className?: string;
  color?: string;
}

export function AnimatedProgress({ value, className, color = "#1d62ed" }: Props) {
  return (
    <div className={cn("relative w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: "0%" }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
      />
    </div>
  );
}
