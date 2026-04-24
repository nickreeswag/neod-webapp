"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NearEarthObject } from "@/types/nasa";
import { AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, Radar } from "lucide-react";

interface HeroStatisticProps {
  objects: NearEarthObject[];
}

export function HeroStatistic({ objects }: HeroStatisticProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hazardousCount = objects.filter((o) => o.is_potentially_hazardous_asteroid).length;
  const isDanger = hazardousCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      layout
      className="bg-aura-bg/40 border border-white/5 backdrop-blur-3xl rounded-2xl relative overflow-hidden group flex flex-col min-w-[180px] sm:min-w-[240px] shadow-2xl pointer-events-auto"
    >
      {/* Dynamic background glow */}
      <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-[60px] opacity-20 transition-colors duration-1000 ${isDanger ? 'bg-aura-red' : 'bg-aura-green'}`} />

      {/* Main Content / Header */}
      <div 
        className="p-3 sm:p-5 cursor-pointer relative z-10"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${isDanger ? 'bg-aura-red/20 text-aura-red shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-aura-green/20 text-aura-green'}`}>
              {isDanger ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <h2 className="text-[9px] sm:text-[10px] font-bold text-aura-text-secondary uppercase tracking-[0.2em]">Hazard Alert</h2>
          </div>
          <div className="sm:hidden text-aura-text-secondary">
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-3xl sm:text-5xl font-black tracking-tighter text-white drop-shadow-2xl">{hazardousCount}</span>
          <div className="flex flex-col">
            <span className="text-aura-text-secondary text-[8px] sm:text-[10px] uppercase tracking-wider font-semibold">Targets</span>
            <span className="text-[7px] sm:text-[9px] text-aura-text-secondary/60">Orbital Proximity</span>
          </div>
        </div>

        {/* Collapsed System Status (Mobile only) */}
        {!isExpanded && (
          <div className="flex items-center gap-1.5 mt-2 sm:hidden">
            <div className={`w-1 h-1 rounded-full animate-pulse ${isDanger ? 'bg-aura-red' : 'bg-aura-green'}`} />
            <p className="text-[8px] text-aura-text-secondary font-medium">
              {isDanger ? "Caution Required" : "System: Nominal"}
            </p>
          </div>
        )}
      </div>

      {/* Expanded Content / System Status */}
      <AnimatePresence>
        {(isExpanded || typeof window !== 'undefined' && window.innerWidth >= 640) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 sm:px-5 sm:pb-5 pt-4 border-t border-white/5 relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Radar className="w-3 h-3 text-aura-text-secondary opacity-50" />
                <p className="text-[8px] sm:text-[9px] text-aura-text-secondary/60 uppercase tracking-widest font-bold">Live Telemetry</p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDanger ? 'bg-aura-red' : 'bg-aura-green'}`} />
                <p className="text-[9px] sm:text-[10px] text-aura-text-secondary font-medium">
                  {isDanger 
                    ? "System: Elevated Caution" 
                    : "System: Nominal Status"}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
