"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NearEarthObject } from "@/types/nasa";
import { formatNumber } from "@/lib/utils";
import { X, ChevronUp, Database, Activity } from "lucide-react";

interface ThreatMatrixProps {
  objects: NearEarthObject[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

export function ThreatMatrix({ objects, selectedId, onSelect }: ThreatMatrixProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sortedObjects = [...objects].sort((a, b) => {
    if (a.is_potentially_hazardous_asteroid && !b.is_potentially_hazardous_asteroid) return -1;
    if (!a.is_potentially_hazardous_asteroid && b.is_potentially_hazardous_asteroid) return 1;
    
    const distA = parseFloat(a.close_approach_data[0].miss_distance.kilometers);
    const distB = parseFloat(b.close_approach_data[0].miss_distance.kilometers);
    return distA - distB;
  });

  return (
    <div className="fixed bottom-0 left-0 w-full z-40 px-0 sm:px-6 pb-0 sm:pb-6 pointer-events-none">
      <div className="mx-auto w-full max-w-7xl sm:flex sm:flex-col sm:items-center">
        
        {/* The Trigger Dock */}
        <motion.button
          layoutId="threat-matrix"
          onClick={() => setIsExpanded(true)}
          className={`pointer-events-auto bg-aura-bg/80 border-t sm:border border-white/10 backdrop-blur-3xl px-8 py-4 sm:py-3 rounded-none sm:rounded-full w-full sm:w-auto flex items-center justify-between sm:justify-center gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] hover:bg-white/10 transition-all group ${isExpanded ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-bold text-aura-text-secondary uppercase tracking-[0.2em]">Threat Matrix Active</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-white text-[11px] font-bold">{objects.length} Objects Tracked</span>
            <ChevronUp className="w-4 h-4 text-aura-text-secondary group-hover:text-white transition-transform group-hover:-translate-y-0.5" />
          </div>
        </motion.button>

        {/* The Modal */}
        <AnimatePresence>
          {isExpanded && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsExpanded(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto z-[-1]"
              />

              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="pointer-events-auto w-full max-w-5xl bg-aura-bg/80 border border-white/10 backdrop-blur-3xl rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[80vh] overflow-hidden"
              >
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-white/[0.02] to-transparent">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                      <Database className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl tracking-tight">Intelligence Matrix</h3>
                      <p className="text-[10px] text-aura-text-secondary uppercase tracking-[0.15em] mt-1">Live NASA NeoWs Feed</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsExpanded(false)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-aura-text-secondary hover:text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-aura-bg/95 backdrop-blur-md">
                      <tr className="text-[10px] text-aura-text-secondary uppercase tracking-[0.15em]">
                        <th className="px-8 py-5 font-bold">Designation</th>
                        <th className="px-8 py-5 font-bold">Est. Diameter</th>
                        <th className="px-8 py-5 font-bold">Miss Distance</th>
                        <th className="px-8 py-5 font-bold">Threat Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sortedObjects.map((obj) => {
                        const isHazard = obj.is_potentially_hazardous_asteroid;
                        const diameter = obj.estimated_diameter.meters.estimated_diameter_max;
                        const missDist = parseFloat(obj.close_approach_data[0].miss_distance.kilometers);

                        return (
                          <tr 
                            key={obj.id} 
                            onClick={() => onSelect?.(obj.id)}
                            className={`hover:bg-white/[0.03] transition-all group cursor-pointer ${selectedId === obj.id ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : 'border-l-2 border-transparent'}`}
                          >
                            <td className="px-8 py-6">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{obj.name}</span>
                                <span className="text-[9px] text-aura-text-secondary mt-1 font-mono">ID: {obj.id}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-sm text-aura-text-secondary font-mono">
                              {formatNumber(Math.round(diameter))} m
                            </td>
                            <td className="px-8 py-6 text-sm text-aura-text-secondary font-mono">
                              {formatNumber(Math.round(missDist))} km
                            </td>
                            <td className="px-8 py-6">
                              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                isHazard 
                                  ? 'bg-aura-red/10 text-aura-red border-aura-red/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                                  : 'bg-aura-green/10 text-aura-green border-aura-green/20'
                              }`}>
                                {isHazard ? 'CRITICAL' : 'NOMINAL'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
