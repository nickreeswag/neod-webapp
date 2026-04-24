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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-8 relative overflow-hidden group flex flex-col justify-between"
    >
      {/* Background glow */}
      <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[100px] opacity-20 transition-colors duration-1000 ${isDanger ? 'bg-aura-red' : 'bg-aura-green'}`} />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg ${isDanger ? 'bg-aura-red/10 text-aura-red' : 'bg-aura-green/10 text-aura-green'}`}>
            {isDanger ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <h2 className="text-sm font-medium text-aura-text-secondary uppercase tracking-widest">Hazardous Objects Today</h2>
        </div>

        <div className="flex items-baseline gap-4">
          <span className="text-7xl font-bold tracking-tighter text-white">{hazardousCount}</span>
          <span className="text-aura-text-secondary text-lg">detected</span>
        </div>
      </div>

      <div className="relative z-10 mt-8 pt-6 border-t border-aura-border/50">
        <p className="text-sm text-aura-text-secondary">
          {isDanger 
            ? "Elevated threat level. Monitoring closely." 
            : "No imminent threats detected within current parameters."}
        </p>
      </div>
    </motion.div>
  );
}
