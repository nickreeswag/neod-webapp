"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Trail, Stars } from "@react-three/drei";
import { NearEarthObject } from "@/types/nasa";
import { formatNumber } from "@/lib/utils";
import * as THREE from "three";
import { X, Clock, Activity, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SolarSystemVisualizerProps {
  objects: NearEarthObject[];
}

// 1 Unit = 10 Lunar Distances (LD)
const SCALE_UNIT = 10;
const AU_TO_LD = 389.17;
const AU_IN_UNITS = AU_TO_LD / SCALE_UNIT; // ~38.9

interface PlanetProps {
  name: string;
  color: string;
  radius: number; // orbital radius in units
  size: number; // visual size
  speed: number; // orbital speed (rad/sec for viz)
  initialAngle?: number;
}

function Planet({ name, color, radius, size, speed, initialAngle = 0 }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime() * speed * 0.05;
      const angle = t + initialAngle;
      meshRef.current.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group>
      {/* Orbital Path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.1, radius + 0.1, 128]} />
        <meshBasicMaterial color={color} transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>
      
      {/* The Planet */}
      <Sphere ref={meshRef} args={[size, 32, 32]}>
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.4}
          metalness={0.9}
          roughness={0.1}
        />
      </Sphere>
    </group>
  );
}

function Sun() {
  return (
    <group>
      <Sphere args={[3, 32, 32]}>
        <meshBasicMaterial color="#fbbf24" />
      </Sphere>
      <pointLight intensity={10} distance={2000} color="#fffbeb" shadow-mapSize={[2048, 2048]} />
      <Sphere args={[3.5, 32, 32]}>
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.15} />
      </Sphere>
    </group>
  );
}

interface AsteroidProps {
  object: NearEarthObject;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  timeOffset: number;
}

function Asteroid({ object, index, isSelected, onSelect, timeOffset }: AsteroidProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [trailReady, setTrailReady] = useState(false);
  
  const approachData = object.close_approach_data[0];
  const missDistLD = parseFloat(approachData.miss_distance.lunar);
  const velocityKph = parseFloat(approachData.relative_velocity.kilometers_per_hour);
  const diameterM = (object.estimated_diameter.meters.estimated_diameter_min + object.estimated_diameter.meters.estimated_diameter_max) / 2;
  
  const isHazard = object.is_potentially_hazardous_asteroid;
  const color = isHazard ? "#EF4444" : "#F59E0B";

  // Scientific Scaling: NEOs are small. We use a base visibility + relative scale.
  const visualScale = useMemo(() => {
    // Logarithmic scale ensures 10m and 1km asteroids are both visible but distinct
    return 0.08 + Math.log10(diameterM / 10) * 0.05;
  }, [diameterM]);

  // Orbit Physics:
  // We model these as solar orbits that intersect Earth's proximity today.
  const orbitParams = useMemo(() => {
    const distFromEarthUnits = missDistLD / SCALE_UNIT;
    // Randomize initial positions for flyby effect
    const angleOffset = (index * 137.5) * (Math.PI / 180);
    const inclination = (index % 5 - 2) * 0.05;
    
    // Angular velocity: v = omega * r => omega = v / r
    // Earth's average distance from Sun is ~38.9 units
    const angularVelocityBase = (velocityKph / 107000) * 0.1; // Normalized to Earth's orbital speed

    return {
      distFromEarthUnits,
      angleOffset,
      inclination,
      angularVelocity: angularVelocityBase
    };
  }, [missDistLD, index, velocityKph]);

  useEffect(() => {
    const timer = setTimeout(() => setTrailReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime() * 0.05 + timeOffset * 0.5;
      
      // Calculate Earth's current position
      const earthAngle = clock.getElapsedTime() * 0.05 * 1.0;
      const ex = Math.cos(earthAngle) * AU_IN_UNITS;
      const ez = Math.sin(earthAngle) * AU_IN_UNITS;

      // Asteroid position: Close to Earth today, but with its own velocity
      const asteroidAngle = earthAngle + orbitParams.angleOffset + (t * orbitParams.angularVelocity);
      
      // We position it relative to Earth based on the miss distance
      const ax = ex + Math.cos(asteroidAngle) * orbitParams.distFromEarthUnits;
      const ay = Math.sin(asteroidAngle) * orbitParams.distFromEarthUnits * orbitParams.inclination;
      const az = ez + Math.sin(asteroidAngle) * orbitParams.distFromEarthUnits;

      meshRef.current.position.set(ax, ay, az);
    }
  });

  return (
    <group ref={meshRef}>
      <Sphere 
        args={[visualScale * 8, 16, 16]} 
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </Sphere>

      {trailReady && (
        <Trail
          width={visualScale * 3}
          color={isSelected ? "#ffffff" : color}
          length={15}
          decay={1}
          local={false}
        >
          <Sphere args={[visualScale, 16, 16]}>
            <meshStandardMaterial color={isSelected ? "#ffffff" : color} emissive={color} emissiveIntensity={3} />
          </Sphere>
        </Trail>
      )}
      
      <Sphere args={[visualScale * 2, 16, 16]}>
        <meshBasicMaterial color={color} transparent opacity={0.2} />
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
    }).slice(0, 45);
  }, [objects]);

  const selectedObject = renderObjects.find(o => o.id === selectedId);

  return (
    <div className="fixed inset-0 z-0 w-full h-full bg-[#020617] overflow-hidden">
      
      {/* NEO Information Panel - Fixed Mobile Overlap */}
      <AnimatePresence>
        {selectedObject && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-20 left-0 w-full px-4 sm:px-0 sm:bottom-auto sm:top-32 sm:right-6 sm:left-auto sm:w-85 z-50 pointer-events-none"
          >
            <div className="bg-aura-bg/90 border border-white/10 backdrop-blur-3xl p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-black mb-1">Observation Target</p>
                  <h4 className="text-white font-bold text-xl truncate pr-4">{selectedObject.name}</h4>
                </div>
                <button 
                  onClick={() => setSelectedId(null)}
                  className="text-aura-text-secondary hover:text-white transition-colors p-2 bg-white/5 rounded-full shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <p className="text-[9px] text-aura-text-secondary uppercase font-bold mb-1">Miss Distance</p>
                  <p className="text-white font-mono text-xs">{formatNumber(Math.round(parseFloat(selectedObject.close_approach_data[0].miss_distance.lunar)))} LD</p>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <p className="text-[9px] text-aura-text-secondary uppercase font-bold mb-1">Velocity</p>
                  <p className="text-white font-mono text-xs">{formatNumber(Math.round(parseFloat(selectedObject.close_approach_data[0].relative_velocity.kilometers_per_hour)))} km/h</p>
                </div>
              </div>

              <div className={`px-4 py-3 rounded-2xl text-[10px] uppercase tracking-widest font-black text-center border ${selectedObject.is_potentially_hazardous_asteroid ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-green-500/20 border-green-500/30 text-green-400'}`}>
                {selectedObject.is_potentially_hazardous_asteroid ? 'Hazard Classification: CRITICAL' : 'Hazard Classification: NOMINAL'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accuracy Legend & Units */}
      <div className="absolute top-28 left-6 z-10 hidden md:block">
        <div className="bg-aura-bg/40 backdrop-blur-md border border-white/10 p-5 rounded-3xl shadow-xl">
          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Info className="w-3 h-3 text-indigo-400" /> Ephemeris Model v2
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-[10px] text-white/80">
              <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
              <span>1 Unit : 10 Lunar Distances</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-white/80">
              <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
              <span>Logarithmic Volumetric Scaling</span>
            </div>
            <div className="pt-2 border-t border-white/5">
              <p className="text-[9px] text-aura-text-secondary leading-relaxed">Trajectories calculated using relative velocity vectors and miss distance epoch.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 cursor-crosshair">
        <Canvas camera={{ position: [0, 80, 140], fov: 45 }} shadows>
          <Stars radius={400} depth={50} count={15000} factor={6} saturation={0} fade speed={1.5} />
          <ambientLight intensity={0.15} />
          
          <Sun />
          
          {/* Inner Solar System */}
          <Planet name="Mercury" color="#94a3b8" radius={15} size={0.3} speed={4.1} initialAngle={1} />
          <Planet name="Venus" color="#fbbf24" radius={28} size={0.8} speed={1.6} initialAngle={2.5} />
          <Planet name="Earth" color="#3b82f6" radius={AU_IN_UNITS} size={1.0} speed={1.0} initialAngle={0} />
          <Planet name="Mars" color="#ef4444" radius={59} size={0.6} speed={0.53} initialAngle={4.2} />
          
          {renderObjects.map((obj, i) => (
            <Asteroid 
              key={obj.id} 
              object={obj} 
              index={i} 
              isSelected={selectedId === obj.id}
              onSelect={() => setSelectedId(obj.id)}
              timeOffset={timeOffset}
            />
          ))}

          <OrbitControls 
            enablePan={true} 
            minDistance={15} 
            maxDistance={500} 
            autoRotate={!selectedId} 
            autoRotateSpeed={0.04} 
          />
        </Canvas>
      </div>

      {/* Timeline Control Group */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-40 hidden sm:block">
        <div className="bg-aura-bg/60 border border-white/10 backdrop-blur-3xl p-5 rounded-3xl shadow-2xl">
          <div className="flex justify-between text-[10px] text-aura-text-secondary mb-4 uppercase tracking-[0.2em] font-black">
            <span className="flex items-center gap-2 text-indigo-400"><Clock className="w-4 h-4" /> Realtime Orbit</span>
            <span className="text-white">Projection: +{timeOffset.toFixed(1)} years</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="50" 
            step="0.1"
            value={timeOffset}
            onChange={(e) => setTimeOffset(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all shadow-inner"
          />
        </div>
      </div>
    </div>
  );
}
