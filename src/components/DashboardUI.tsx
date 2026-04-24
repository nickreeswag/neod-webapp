"use client";

import { useState, useMemo } from "react";
import { NearEarthObject } from "@/types/nasa";
import { CommandHeader } from "@/components/CommandHeader";
import { HeroStatistic } from "@/components/HeroStatistic";
import { SolarSystemVisualizer } from "@/components/SolarSystemVisualizer";
import { ThreatMatrix } from "@/components/ThreatMatrix";

interface DashboardUIProps {
  objectsToday: NearEarthObject[];
}

export function DashboardUI({ objectsToday }: DashboardUIProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#030712] selection:bg-indigo-500/30">
      {/* Background Layer: The 3D Visualizer */}
      <SolarSystemVisualizer 
        objects={objectsToday} 
        selectedId={selectedId}
        onSelect={setSelectedId}
        simulationSpeed={simulationSpeed}
        onSpeedChange={setSimulationSpeed}
      />

      {/* UI Overlay Layer */}
      <div className="relative z-10 h-full w-full pointer-events-none flex flex-col">
        {/* Top Section: Header and Mini Hero Stat */}
        <div className="flex flex-col w-full">
          <div className="pointer-events-auto">
            <CommandHeader />
          </div>
          
          <div className="px-6 flex justify-between items-start pointer-events-none mt-4">
            <div className="pointer-events-auto">
              <HeroStatistic objects={objectsToday} />
            </div>
          </div>
        </div>

        {/* The Threat Matrix Dock */}
        <div className="pointer-events-auto">
          <ThreatMatrix 
            objects={objectsToday} 
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </div>
    </div>
  );
}
