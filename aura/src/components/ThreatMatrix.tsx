"use client";

import { NearEarthObject } from "@/types/nasa";
import { formatNumber } from "@/lib/utils";

interface ThreatMatrixProps {
  objects: NearEarthObject[];
}

export function ThreatMatrix({ objects }: ThreatMatrixProps) {
  // Sort hazardous first, then by miss distance closest
  const sortedObjects = [...objects].sort((a, b) => {
    if (a.is_potentially_hazardous_asteroid && !b.is_potentially_hazardous_asteroid) return -1;
    if (!a.is_potentially_hazardous_asteroid && b.is_potentially_hazardous_asteroid) return 1;
    
    const distA = parseFloat(a.close_approach_data[0].miss_distance.kilometers);
    const distB = parseFloat(b.close_approach_data[0].miss_distance.kilometers);
    return distA - distB;
  });

  return (
    <div className="glass-panel overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-aura-border">
        <h3 className="text-sm font-medium text-aura-text-secondary uppercase tracking-widest">Threat Matrix</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-aura-border/50 text-xs text-aura-text-secondary">
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Object Designation</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Max Diameter</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Miss Distance</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aura-border/30">
            {sortedObjects.map((obj) => {
              const isHazard = obj.is_potentially_hazardous_asteroid;
              const diameter = obj.estimated_diameter.meters.estimated_diameter_max;
              const missDist = parseFloat(obj.close_approach_data[0].miss_distance.kilometers);

              return (
                <tr key={obj.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-white whitespace-nowrap">
                    {obj.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-aura-text-secondary whitespace-nowrap">
                    {formatNumber(Math.round(diameter))} m
                  </td>
                  <td className="px-6 py-4 text-sm text-aura-text-secondary whitespace-nowrap">
                    {formatNumber(Math.round(missDist))} km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      isHazard 
                        ? 'bg-aura-red/10 text-aura-red border-aura-red/20' 
                        : 'bg-aura-green/10 text-aura-green border-aura-green/20'
                    }`}>
                      {isHazard ? 'Hazardous' : 'Safe'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
