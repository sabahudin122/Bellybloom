"use client";

import { motion } from "framer-motion";
import { Apple, Carrot, Cherry, Heart } from "lucide-react";

export function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, rotate: -3 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="absolute inset-[8%] rounded-[42%_58%_48%_52%/52%_38%_62%_48%] bg-[#c8b6ff]/75"
      />
      <div className="absolute inset-[17%] grid place-items-center rounded-[3rem] border-[10px] border-white/70 bg-[#fffdf8] shadow-[0_35px_80px_rgba(62,49,92,.2)] dark:border-white/10 dark:bg-[#24334b]">
        <div className="relative grid size-[62%] place-items-center rounded-full bg-[#ffde72] shadow-inner">
          <div className="absolute left-[13%] top-[22%] size-[28%] rounded-full bg-[#ff936b]" />
          <div className="absolute bottom-[18%] right-[12%] size-[32%] rounded-full bg-[#9ee7c7]" />
          <div className="relative text-center">
            <span className="block text-6xl sm:text-7xl">🥣</span>
            <span className="mt-2 block text-sm font-black text-[#26354c]">Today&apos;s tiny feast</span>
          </div>
        </div>
      </div>
      {[
        { Icon: Apple, color: "bg-[#ffb997]", position: "left-[1%] top-[14%]", delay: 0 },
        { Icon: Carrot, color: "bg-[#9ee7c7]", position: "right-[0%] top-[23%]", delay: 0.15 },
        { Icon: Cherry, color: "bg-[#a8d8ff]", position: "bottom-[5%] left-[12%]", delay: 0.3 },
        { Icon: Heart, color: "bg-[#ffe27a]", position: "bottom-[9%] right-[5%]", delay: 0.45 },
      ].map(({ Icon, color, position, delay }) => (
        <motion.div
          key={position}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: [0, -8, 0] }}
          transition={{ opacity: { delay }, y: { repeat: Infinity, duration: 3.2, delay } }}
          className={`absolute ${position} grid size-16 place-items-center rounded-3xl ${color} text-[#26354c] shadow-lg sm:size-20`}
        >
          <Icon className="size-8" strokeWidth={2.3} />
        </motion.div>
      ))}
    </div>
  );
}
