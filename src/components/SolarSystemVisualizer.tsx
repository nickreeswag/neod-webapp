"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Trail } from "@react-three/drei";
import { NearEarthObject } from "@/types/nasa";
import { formatNumber } from "@/lib/utils";
import * as THREE from "three";
import { X, Clock, Navigation, Info } from "lucide-react";

interface SolarSystemVisualizerProps {
  objects: NearEarthObject[];
}

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group>
      {/* Glow effect */}
      <Sphere args={[1.2, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.15} side={THREE.BackSide} />
      </Sphere>
      
      {/* Wireframe Earth */}
      <Sphere ref={earthRef} args={[1, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color="#1d4ed8"
          wireframe 
          emissive="#2563eb" 
          emissiveIntensity={0.5} 
          transparent
          opacity={0.8}
        />
      </Sphere>
    </group>
  );
}

interface AsteroidProps {
  object: NearEarthObject;
  index: number;
  total: number;
  isSelected: boolean;
  onSelect: () => void;
  timeOffset: number;
}

function Asteroid({ object, index, total, isSelected, onSelect, timeOffset }: AsteroidProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [trailReady, setTrailReady] = useState(false);
  
  const missDistLD = parseFloat(object.close_approach_data[0].miss_distance.lunar);
  const velocityKph = parseFloat(object.close_approach_data[0].relative_velocity.kilometers_per_hour);
  const isHazard = object.is_potentially_hazardous_asteroid;
  const color = isHazard ? "#EF4444" : "#F59E0B";

  // Calculate base position
  const basePosition = useMemo(() => {
    const minVizDist = 1.5;
    const maxVizDist = 8;
    const scaledDist = Math.max(minVizDist, Math.min(maxVizDist, minVizDist + (missDistLD / 100) * maxVizDist));
    
    const phi = Math.acos(-1 + (2 * index) / total);
    const theta = Math.sqrt(total * Math.PI) * phi;
    
    const x = scaledDist * Math.cos(theta) * Math.sin(phi);
    const y = scaledDist * Math.sin(theta) * Math.sin(phi);
    const z = scaledDist * Math.cos(phi);
    
    return new THREE.Vector3(x, y, z);
  }, [missDistLD, index, total]);

  // Prevent trail spaghetti on load by waiting for initial render
  useEffect(() => {
    const timer = setTimeout(() => setTrailReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Absolute orbit calculation
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const baseRotation = clock.getElapsedTime() * 0.05;
      const scrubRotation = timeOffset * (velocityKph * 0.00005);
      const totalRotation = (index % 2 === 0 ? 1 : -1) * (baseRotation + scrubRotation);

      meshRef.current.position.copy(basePosition).applyAxisAngle(new THREE.Vector3(0, 1, 0), totalRotation);
    }
  });

  return (
    <group ref={meshRef}>
      {/* Invisible Hitbox for click-to-select */}
      <Sphere 
        args={[0.8, 16, 16]} 
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </Sphere>

      {trailReady && (
        <Trail
          width={isHazard ? 0.5 : 0.2}
          color={isSelected ? "#ffffff" : color}
          length={8}
          decay={1}
          local={false}
        >
          <Sphere args={[isHazard ? 0.15 : 0.08, 16, 16]}>
            <meshBasicMaterial color={isSelected ? "#ffffff" : color} />
          </Sphere>
        </Trail>
      )}
      
      {/* Outer glow */}
      <Sphere args={[isHazard ? 0.3 : 0.15, 16, 16]}>
        <meshBasicMaterial color={isSelected ? "#ffffff" : color} transparent opacity={isSelected ? 0.5 : 0.2} depthWrite={false} />
      </Sphere>
    </group>
  );
}

export function SolarSystemVisualizer({ objects }: SolarSystemVisualizerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timeOffset, setTimeOffset] = useState<number>(0);
  const [showGuide, setShowGuide] = useState<boolean>(true);

  const renderObjects = useMemo(() => {
    return [...objects].sort((a, b) => {
      return parseFloat(a.close_approach_data[0].miss_distance.lunar) - parseFloat(b.close_approach_data[0].miss_distance.lunar);
    }).slice(0, 50);
  }, [objects]);

  const selectedObject = renderObjects.find(o => o.id === selectedId);

  return (
    <div className="glass-panel w-full h-full relative overflow-hidden flex flex-col group">
      
      {/* Top Left Title */}
      <div className="absolute top-0 left-0 p-6 z-10 pointer-events-none">
        <h3 className="text-sm font-medium text-aura-text-secondary uppercase tracking-widest flex items-center gap-2">
          <span>Orbital Proximity Tracker</span>
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs text-aura-text-secondary hover:text-white bg-aura-border/20 px-2 py-1 rounded-full pointer-events-auto cursor-pointer transition-colors"
          >
            <Info className="w-3 h-3 inline mr-1" />How it works
          </button>
        </h3>
        
        {showGuide ? (
          <div className="mt-4 p-4 bg-aura-bg/95 border border-aura-border rounded-lg max-w-xs shadow-xl pointer-events-auto relative">
            <button onClick={() => setShowGuide(false)} className="absolute top-3 right-3 text-aura-text-secondary hover:text-white"><X className="w-3 h-3" /></button>
            <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2"><Navigation className="w-4 h-4 text-indigo-400" /> Getting Started</h4>
            <ul className="text-xs text-aura-text-secondary space-y-3">
              <li><strong className="text-white">Rotate:</strong> Click and drag the Earth to spin the solar system.</li>
              <li><strong className="text-white">Zoom:</strong> Scroll to inspect asteroids closer.</li>
              <li><strong className="text-white">Inspect:</strong> Click any glowing orb to view its NASA data.</li>
              <li><strong className="text-white">Simulate:</strong> Use the timeline slider below to project future orbital paths.</li>
            </ul>
          </div>
        ) : (
          <p className="text-xs text-aura-text-secondary/70 mt-1">Drag to rotate • Scroll to zoom • Click objects</p>
        )}
      </div>

      {/* Selected Object Info Panel (Top Right) */}
      {selectedObject && (
        <div className="absolute top-6 right-6 w-72 bg-aura-bg/90 border border-aura-border backdrop-blur-xl p-5 rounded-xl shadow-2xl z-20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-white font-medium truncate pr-4">{selectedObject.name}</h4>
            <button 
              onClick={() => setSelectedId(null)}
              className="text-aura-text-secondary hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-aura-border/50 pb-2">
              <span className="text-aura-text-secondary">Miss Distance</span>
              <span className="text-white font-mono">{formatNumber(Math.round(parseFloat(selectedObject.close_approach_data[0].miss_distance.lunar)))} LD</span>
            </div>
            <div className="flex justify-between border-b border-aura-border/50 pb-2">
              <span className="text-aura-text-secondary">Velocity</span>
              <span className="text-white font-mono">{formatNumber(Math.round(parseFloat(selectedObject.close_approach_data[0].relative_velocity.kilometers_per_hour)))} km/h</span>
            </div>
            <div className="flex justify-between border-b border-aura-border/50 pb-2">
              <span className="text-aura-text-secondary">Diameter (Est)</span>
              <span className="text-white font-mono">{Math.round(selectedObject.estimated_diameter.meters.estimated_diameter_max)} m</span>
            </div>
          </div>
          
          <div className={`mt-4 px-3 py-2 rounded-lg text-xs uppercase tracking-wider font-bold text-center border ${selectedObject.is_potentially_hazardous_asteroid ? 'bg-aura-red/10 border-aura-red/20 text-aura-red' : 'bg-aura-amber/10 border-aura-amber/20 text-aura-amber'}`}>
            {selectedObject.is_potentially_hazardous_asteroid ? 'Potentially Hazardous' : 'Standard Tracking'}
          </div>

          <div className="mt-4 text-[10px] text-aura-text-secondary/50 leading-relaxed border-t border-aura-border/50 pt-3">
            * Data sourced from NASA API. Timeline trajectories are visually simulated projections based on current relative velocity. True orbital mechanics require multi-body physics equations.
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <div className="flex-1 w-full h-full relative" onClick={(e) => {
        // Deselect if clicking empty space (requires careful event bubbling, so we let OrbitControls handle drag, but click on canvas background deselects)
        if (e.target === e.currentTarget) setSelectedId(null);
      }}>
        <Canvas camera={{ position: [0, 2, 6], fov: 45 }} onPointerMissed={() => setSelectedId(null)}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
          
          <Earth />
          
          {renderObjects.map((obj, i) => (
            <Asteroid 
              key={obj.id} 
              object={obj} 
              index={i} 
              total={renderObjects.length} 
              isSelected={selectedId === obj.id}
              onSelect={() => setSelectedId(obj.id)}
              timeOffset={timeOffset}
            />
          ))}

          <OrbitControls 
            enablePan={false} 
            minDistance={2} 
            maxDistance={15} 
            autoRotate={!selectedId} 
            autoRotateSpeed={0.2} 
          />
        </Canvas>
      </div>

      {/* Timeline Slider Overlay (Bottom) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[80%] max-w-md bg-aura-bg/80 border border-aura-border backdrop-blur-md p-4 rounded-xl z-20">
        <div className="flex justify-between text-xs text-aura-text-secondary mb-2 uppercase tracking-widest font-medium">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Today</span>
          <span className="flex items-center gap-1 text-white">Trajectory +{timeOffset.toFixed(1)} Yrs <Navigation className="w-3 h-3 text-aura-text-secondary" /></span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="50" 
          step="0.1"
          value={timeOffset}
          onChange={(e) => setTimeOffset(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-aura-border rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>
    </div>
  );
}
