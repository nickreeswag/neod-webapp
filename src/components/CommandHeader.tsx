"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Orbit, HelpCircle, X, Navigation, MousePointer2, Move, Activity } from "lucide-react";

export function CommandHeader() {
  const [showGuide, setShowGuide] = useState(false);
  const date = format(new Date(), "dd MMM yyyy");

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex items-center justify-between py-6 px-8 border-b border-aura-border bg-aura-bg/50 backdrop-blur-md sticky top-0 z-50"
    >
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_-5px_rgba(99,102,241,0.8)]">
          <Orbit className="text-white w-4 h-4" />
        </div>
        <h1 className="text-xl font-medium tracking-tight">The NEOD</h1>
      </div>

      <div className="flex items-center gap-6 text-sm text-aura-text-secondary">
        <div className="relative">
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${showGuide ? 'bg-white/10 border-white/20 text-white' : 'hover:bg-white/5 border-transparent'}`}
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">How it works</span>
          </button>

          <AnimatePresence>
            {showGuide && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-12 right-0 w-72 bg-aura-bg/95 border border-white/10 backdrop-blur-2xl p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[60]"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-white font-bold text-sm flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-indigo-400" /> System Guide
                  </h4>
                  <button onClick={() => setShowGuide(false)} className="text-aura-text-secondary hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <Move className="w-4 h-4 text-aura-text-secondary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white text-xs font-semibold">Orbital Rotation</p>
                      <p className="text-[10px] text-aura-text-secondary leading-relaxed">Drag the viewport to rotate the proximity tracker and explore the 3D space.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <MousePointer2 className="w-4 h-4 text-aura-text-secondary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white text-xs font-semibold">Object Inspection</p>
                      <p className="text-[10px] text-aura-text-secondary leading-relaxed">Click any glowing asteroid to retrieve deep-space telemetry and hazard data.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <Activity className="w-4 h-4 text-aura-text-secondary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white text-xs font-semibold">Trajectory Projection</p>
                      <p className="text-[10px] text-aura-text-secondary leading-relaxed">Use the timeline slider at the bottom to project orbital paths up to 50 years into the future.</p>
                    </div>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-6">
          <span suppressHydrationWarning className="hidden md:inline">{date}</span>
          <div className="flex items-center gap-2 group relative cursor-help">
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-2 h-2 rounded-full bg-aura-green shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            />
            <span className="text-aura-green font-bold text-[11px] uppercase tracking-wider">Live Connection</span>
            
            {/* Metadata Tooltip */}
            <div className="absolute top-full mt-4 right-0 hidden group-hover:block w-64 bg-aura-bg/95 border border-white/10 backdrop-blur-xl p-4 rounded-2xl shadow-2xl z-[100]">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-3 h-3 text-indigo-400" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Signal Metadata</span>
              </div>
              <p className="text-[10px] text-aura-text-secondary leading-relaxed">
                Direct asynchronous uplink to NASA JPL NeoWs (Near Earth Object Web Service). 
                Status: ACTIVE. Telemetry stream provides sub-meter precision for orbital state vectors.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
