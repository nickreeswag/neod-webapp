"use client";

import { NearEarthObject } from "@/types/nasa";
import { formatNumber } from "@/lib/utils";
import { X, Zap, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TargetAnalysisPanelProps {
  selectedObject: NearEarthObject | null;
  onClose: () => void;
}

export function TargetAnalysisPanel({ selectedObject, onClose }: TargetAnalysisPanelProps) {
  if (!selectedObject) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center sm:items-start sm:justify-end sm:p-6 sm:pt-32">
        {/* Backdrop for mobile to handle click-outside */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto sm:hidden"
        />

        <motion.div 
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg px-4 sm:px-0 sm:w-96 pointer-events-none"
        >
          <div 
            className="bg-aura-bg/95 border border-white/10 backdrop-blur-3xl p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden border border-white/20">
                   <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-black mb-1">Target Analysis</p>
                  <h4 className="text-white font-bold text-lg truncate w-48">{selectedObject.name}</h4>
                </div>
              </div>
              <button onClick={onClose} className="text-aura-text-secondary hover:text-white transition-colors p-2 bg-white/5 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[9px] text-aura-text-secondary uppercase font-bold mb-1">Relative Miss</p>
                <p className="text-white font-mono text-xs">{formatNumber(Math.round(parseFloat(selectedObject.close_approach_data[0].miss_distance.lunar)))} LD</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[9px] text-aura-text-secondary uppercase font-bold mb-1">Speed</p>
                <p className="text-white font-mono text-xs">{formatNumber(Math.round(parseFloat(selectedObject.close_approach_data[0].relative_velocity.kilometers_per_hour)))} km/h</p>
              </div>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-3 h-3 text-indigo-400" />
                <p className="text-[9px] text-indigo-400 uppercase font-black tracking-widest">Closest Approach</p>
              </div>
              <p className="text-white font-mono text-xs">{selectedObject.close_approach_data[0].close_approach_date_full}</p>
            </div>

            <div className={`px-4 py-3 rounded-xl text-[10px] uppercase tracking-widest font-black text-center border ${selectedObject.is_potentially_hazardous_asteroid ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-green-500/20 border-green-500/30 text-green-400'}`}>
              {selectedObject.is_potentially_hazardous_asteroid ? 'Hazardous Object' : 'Safe Trajectory'}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
