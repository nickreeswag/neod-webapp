"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronUp, ChevronDown, Clock } from "lucide-react";

interface SimulationControlProps {
  simulationSpeed: number;
  onSpeedChange: (speed: number) => void;
  simulatedDate: Date;
}

export function SimulationControl({ 
  simulationSpeed, 
  onSpeedChange, 
  simulatedDate 
}: SimulationControlProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const speeds = [1, 10, 100, 500, 2500];

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 sm:px-6 z-40">
      <motion.div 
        layout
        className="bg-aura-bg/60 border border-white/10 backdrop-blur-3xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        {/* Header / Collapsed View */}
        <div 
          className="p-4 sm:p-6 cursor-pointer flex justify-between items-center"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-indigo-400 mb-0.5 sm:mb-1">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[8px] sm:text-[10px] text-aura-text-secondary uppercase tracking-[0.2em] font-black">Temporal Sync</span>
            </div>
            <p className="text-white font-mono text-sm sm:text-lg font-bold">
              {simulatedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              <span className="text-indigo-400 ml-2 sm:ml-3 opacity-80">
                {simulatedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[8px] sm:text-[10px] text-aura-text-secondary uppercase tracking-widest font-bold mb-0.5 sm:mb-1">Scalar</span>
              <span className="text-white text-sm sm:text-xl font-black italic">{simulationSpeed}x</span>
            </div>
            <div className="bg-white/5 p-1.5 rounded-full text-aura-text-secondary group-hover:text-white transition-colors">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Expanded View: Speed Selection */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="px-4 pb-4 sm:px-6 sm:pb-6 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-3 h-3 text-indigo-400" />
                  <span className="text-[9px] text-aura-text-secondary uppercase tracking-widest font-bold">Select Velocity</span>
                </div>
                <div className="flex gap-2">
                  {speeds.map((speed) => (
                    <button
                      key={speed}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSpeedChange(speed);
                      }}
                      className={`flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black transition-all border ${
                        simulationSpeed === speed 
                          ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]' 
                          : 'bg-white/5 border-white/5 text-aura-text-secondary hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {speed === 2500 ? 'MAX' : `${speed}x`}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
