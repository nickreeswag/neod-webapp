import { NeoWsResponse } from "@/types/nasa";
import { format } from "date-fns";
import { CommandHeader } from "@/components/CommandHeader";
import { HeroStatistic } from "@/components/HeroStatistic";
import { SolarSystemVisualizer } from "@/components/SolarSystemVisualizer";
import { ThreatMatrix } from "@/components/ThreatMatrix";

async function getNeoData() {
  const today = format(new Date(), "yyyy-MM-dd");
  try {
    const res = await fetch(
      `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=DEMO_KEY`,
      { 
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(10000) 
      }
    );

    if (!res.ok) {
      console.warn("NASA API returned error, using fallback data");
      return getFallbackData(today);
    }

    return await res.json() as Promise<NeoWsResponse>;
  } catch (error) {
    console.warn("NASA API fetch failed during build, using fallback state:", error);
    return getFallbackData(today);
  }
}

function getFallbackData(date: string): NeoWsResponse {
  return {
    element_count: 0,
    near_earth_objects: { [date]: [] },
    links: { next: "", prev: "", self: "" }
  };
}

export default async function Dashboard() {
  const data = await getNeoData();
  const todayDate = format(new Date(), "yyyy-MM-dd");
  const objectsToday = data.near_earth_objects[todayDate] || [];

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#030712] selection:bg-indigo-500/30">
      {/* Background Layer: The 3D Visualizer */}
      <SolarSystemVisualizer objects={objectsToday} />

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
            
            {/* Additional HUD elements could go here (Right side) */}
          </div>
        </div>

        {/* The Threat Matrix Dock is self-contained and fixed, so it doesn't need to be in the flex flow */}
        <ThreatMatrix objects={objectsToday} />
      </div>
    </main>
  );
}
