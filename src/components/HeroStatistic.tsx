"use client";

import { motion } from "framer-motion";
import { NearEarthObject } from "@/types/nasa";
import { AlertTriangle, ShieldCheck } from "lucide-react";

interface HeroStatisticProps {
  objects: NearEarthObject[];
}

export function HeroStatistic({ objects }: HeroStatisticProps) {
  const hazardousCount = objects.filter((o) => o.is_potentially_hazardous_asteroid).length;
  const isDanger = hazardousCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-aura-bg/40 border border-white/5 backdrop-blur-3xl p-3 sm:p-5 rounded-2xl relative overflow-hidden group flex flex-col min-w-[160px] sm:min-w-[240px] shadow-2xl"
    >
      {/* Dynamic background glow */}
      <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-[60px] opacity-20 transition-colors duration-1000 ${isDanger ? 'bg-aura-red' : 'bg-aura-green'}`} />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2 sm:mb-4">
          <div className={`p-1.5 rounded-lg ${isDanger ? 'bg-aura-red/20 text-aura-red shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-aura-green/20 text-aura-green'}`}>
            {isDanger ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </div>
          <h2 className="text-[9px] sm:text-[10px] font-bold text-aura-text-secondary uppercase tracking-[0.2em]">Hazard Alert</h2>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-4xl sm:text-5xl font-black tracking-tighter text-white drop-shadow-2xl">{hazardousCount}</span>
          <div className="flex flex-col">
            <span className="text-aura-text-secondary text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold">Targets</span>
            <span className="text-[8px] sm:text-[9px] text-aura-text-secondary/60">Near Earth Today</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-5 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDanger ? 'bg-aura-red' : 'bg-aura-green'}`} />
          <p className="text-[10px] text-aura-text-secondary font-medium">
            {isDanger 
              ? "System: Elevated Caution" 
              : "System: Nominal Status"}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
