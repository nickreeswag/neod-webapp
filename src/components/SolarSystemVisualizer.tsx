"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Trail } from "@react-three/drei";
import { NearEarthObject } from "@/types/nasa";
import { formatNumber } from "@/lib/utils";
import * as THREE from "three";
import { X, Clock } from "lucide-react";
import { motion } from "framer-motion";

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

  const renderObjects = useMemo(() => {
    return [...objects].sort((a, b) => {
      return parseFloat(a.close_approach_data[0].miss_distance.lunar) - parseFloat(b.close_approach_data[0].miss_distance.lunar);
    }).slice(0, 50);
  }, [objects]);

  const selectedObject = renderObjects.find(o => o.id === selectedId);

  return (
    <div className="fixed inset-0 z-0 w-full h-full bg-[#030712] overflow-hidden flex flex-col">
      

      {/* Selected Object Info Panel (Right Side - Floating) */}
      {selectedObject && (
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute top-32 right-6 w-72 bg-aura-bg/60 border border-white/10 backdrop-blur-2xl p-6 rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] z-20"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] text-aura-text-secondary uppercase tracking-[0.15em] mb-1">Target Identified</p>
              <h4 className="text-white font-bold text-lg truncate">{selectedObject.name}</h4>
            </div>
            <button 
              onClick={() => setSelectedId(null)}
              className="text-aura-text-secondary hover:text-white transition-colors p-1.5 bg-white/5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center group">
              <span className="text-aura-text-secondary group-hover:text-aura-text-primary transition-colors">Miss Distance</span>
              <span className="text-white font-mono bg-white/5 px-2 py-1 rounded">{formatNumber(Math.round(parseFloat(selectedObject.close_approach_data[0].miss_distance.lunar)))} LD</span>
            </div>
            <div className="flex justify-between items-center group">
              <span className="text-aura-text-secondary group-hover:text-aura-text-primary transition-colors">Relative Velocity</span>
              <span className="text-white font-mono bg-white/5 px-2 py-1 rounded">{formatNumber(Math.round(parseFloat(selectedObject.close_approach_data[0].relative_velocity.kilometers_per_hour)))} km/h</span>
            </div>
            <div className="flex justify-between items-center group">
              <span className="text-aura-text-secondary group-hover:text-aura-text-primary transition-colors">Max Diameter</span>
              <span className="text-white font-mono bg-white/5 px-2 py-1 rounded">{Math.round(selectedObject.estimated_diameter.meters.estimated_diameter_max)} m</span>
            </div>
          </div>
          
          <div className={`mt-6 px-3 py-2.5 rounded-xl text-[10px] uppercase tracking-[0.1em] font-black text-center border shadow-inner ${selectedObject.is_potentially_hazardous_asteroid ? 'bg-aura-red/10 border-aura-red/20 text-aura-red' : 'bg-aura-green/10 border-aura-green/20 text-aura-green'}`}>
            {selectedObject.is_potentially_hazardous_asteroid ? 'Hazard Level: High' : 'Hazard Level: Minimal'}
          </div>
        </motion.div>
      )}

      {/* 3D Canvas */}
      <div className="absolute inset-0 cursor-crosshair" onClick={(e) => {
        if (e.target === e.currentTarget) setSelectedId(null);
      }}>
        <Canvas camera={{ position: [0, 4, 10], fov: 45 }} onPointerMissed={() => setSelectedId(null)}>
          <ambientLight intensity={0.4} />
          <pointLight position={[15, 15, 15]} intensity={2} color="#ffffff" />
          
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
            minDistance={4} 
            maxDistance={25} 
            autoRotate={!selectedId} 
            autoRotateSpeed={0.15} 
          />
        </Canvas>
      </div>

      {/* Timeline Slider Overlay (Bottom - Redesigned) */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-10 hidden md:block">
        <div className="bg-aura-bg/40 border border-white/5 backdrop-blur-3xl p-5 rounded-2xl">
          <div className="flex justify-between text-[10px] text-aura-text-secondary mb-3 uppercase tracking-widest font-semibold">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 opacity-50" /> Realtime</span>
            <span className="text-indigo-400">Trajectory Projection: +{timeOffset.toFixed(1)}y</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="50" 
            step="0.1"
            value={timeOffset}
            onChange={(e) => setTimeOffset(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
