import { NeoWsResponse } from "@/types/nasa";
import { format } from "date-fns";

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

import { DashboardUI } from "@/components/DashboardUI";

export default async function Dashboard() {
  const data = await getNeoData();
  const todayDate = format(new Date(), "yyyy-MM-dd");
  const objectsToday = data.near_earth_objects[todayDate] || [];

  return <DashboardUI objectsToday={objectsToday} />;
}
