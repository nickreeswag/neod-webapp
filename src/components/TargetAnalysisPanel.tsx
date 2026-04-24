"use client";

import { useEffect, useCallback } from "react";
import { NearEarthObject } from "@/types/nasa";
import { formatNumber } from "@/lib/utils";
import { X, Zap, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TargetAnalysisPanelProps {
  selectedObject: NearEarthObject | null;
  allObjects: NearEarthObject[];
  onSelect: (id: string | null) => void;
  onClose: () => void;
}

export function TargetAnalysisPanel({ selectedObject, allObjects, onSelect, onClose }: TargetAnalysisPanelProps) {
  const currentIndex = allObjects.findIndex(o => o.id === selectedObject?.id);
  
  const handlePrev = useCallback(() => {
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + allObjects.length) % allObjects.length;
    onSelect(allObjects[prevIndex].id);
  }, [currentIndex, allObjects, onSelect]);

  const handleNext = useCallback(() => {
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % allObjects.length;
    onSelect(allObjects[nextIndex].id);
  }, [currentIndex, allObjects, onSelect]);

  // Keyboard navigation
  useEffect(() => {
    if (!selectedObject) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedObject, currentIndex, allObjects, handlePrev, handleNext, onClose]);

  if (!selectedObject) return null;

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center sm:items-start sm:justify-end sm:p-6 sm:pt-32">
        {/* Backdrop for mobile to handle click-outside */}
        <motion.div 
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto sm:hidden"
        />

        <motion.div 
          key={selectedObject.id}
          initial={{ x: 20, opacity: 0, scale: 0.95 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -20, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-lg px-4 sm:px-0 sm:w-96 pointer-events-none"
        >
          <div 
            className="bg-aura-bg/95 border border-white/10 backdrop-blur-3xl p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Navigation */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden border border-white/20 shadow-lg shadow-indigo-500/20">
                   <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-black">Target Analysis</p>
                    <span className="text-[10px] text-white/30 font-mono">[{currentIndex + 1}/{allObjects.length}]</span>
                  </div>
                  <h4 className="text-white font-bold text-lg truncate w-40 sm:w-48 leading-tight">{selectedObject.name}</h4>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={handlePrev}
                  className="text-aura-text-secondary hover:text-white transition-all p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/5"
                  title="Previous Object"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleNext}
                  className="text-aura-text-secondary hover:text-white transition-all p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/5"
                  title="Next Object"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={onClose} 
                  className="ml-2 text-aura-text-secondary hover:text-white transition-all p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group hover:border-indigo-500/30 transition-colors">
                <p className="text-[9px] text-aura-text-secondary uppercase font-bold mb-1">Relative Miss</p>
                <p className="text-white font-mono text-xs">{formatNumber(Math.round(parseFloat(selectedObject.close_approach_data[0].miss_distance.lunar)))} <span className="text-white/40 ml-0.5">LD</span></p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group hover:border-indigo-500/30 transition-colors">
                <p className="text-[9px] text-aura-text-secondary uppercase font-bold mb-1">Velocity</p>
                <p className="text-white font-mono text-xs">{formatNumber(Math.round(parseFloat(selectedObject.close_approach_data[0].relative_velocity.kilometers_per_hour)))} <span className="text-white/40 ml-0.5">km/h</span></p>
              </div>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl mb-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Calendar className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-3 h-3 text-indigo-400" />
                <p className="text-[9px] text-indigo-400 uppercase font-black tracking-widest">Closest Approach</p>
              </div>
              <p className="text-white font-mono text-xs">{selectedObject.close_approach_data[0].close_approach_date_full}</p>
            </div>

            <div className={`px-4 py-3 rounded-xl text-[10px] uppercase tracking-widest font-black text-center border transition-all duration-500 ${selectedObject.is_potentially_hazardous_asteroid ? 'bg-red-500/20 border-red-500/30 text-red-400 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]' : 'bg-green-500/20 border-green-500/30 text-green-400 shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]'}`}>
              {selectedObject.is_potentially_hazardous_asteroid ? 'Hazardous Object' : 'Safe Trajectory'}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
