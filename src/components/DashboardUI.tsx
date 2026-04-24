"use client";

import { useState } from "react";
import { NearEarthObject } from "@/types/nasa";
import { CommandHeader } from "@/components/CommandHeader";
import { HeroStatistic } from "@/components/HeroStatistic";
import { SolarSystemVisualizer } from "@/components/SolarSystemVisualizer";
import { ThreatMatrix } from "@/components/ThreatMatrix";
import { SimulationControl } from "@/components/SimulationControl";

interface DashboardUIProps {
  objectsToday: NearEarthObject[];
}

export function DashboardUI({ objectsToday }: DashboardUIProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [simulatedDate, setSimulatedDate] = useState<Date>(new Date());

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#030712] selection:bg-indigo-500/30">
      {/* Background Layer: The 3D Visualizer */}
      <SolarSystemVisualizer 
        objects={objectsToday} 
        selectedId={selectedId}
        onSelect={setSelectedId}
        simulationSpeed={simulationSpeed}
        simulatedDate={simulatedDate}
        setSimulatedDate={setSimulatedDate}
      />

      {/* UI Overlay Layer */}
      <div className="relative z-10 h-full w-full pointer-events-none flex flex-col">
        {/* Top Section: Header and Mini Hero Stat */}
        <div className="flex flex-col w-full">
          <div className="pointer-events-auto">
            <CommandHeader />
          </div>
          
          <div className="w-full flex justify-center sm:justify-start pointer-events-none mt-4 sm:px-8">
            <div className="w-full max-w-lg sm:max-w-md px-4 sm:px-0 pointer-events-auto">
              <HeroStatistic objects={objectsToday} />
            </div>
          </div>
        </div>

        {/* Simulation Control (Mobile Collapsible) */}
        <div className="pointer-events-auto">
          <SimulationControl 
            simulationSpeed={simulationSpeed}
            onSpeedChange={setSimulationSpeed}
            simulatedDate={simulatedDate}
          />
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
