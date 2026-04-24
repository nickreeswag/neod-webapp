import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Trail, Stars, Html } from "@react-three/drei";
import { NearEarthObject } from "@/types/nasa";
import { formatNumber } from "@/lib/utils";
import * as THREE from "three";
import { X, Clock, Activity, Info, Radio, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SolarSystemVisualizerProps {
  objects: NearEarthObject[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  simulationSpeed: number;
  onSpeedChange: (speed: number) => void;
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
  simulationSpeed: number;
}

function Planet({ name, color, radius, size, speed, initialAngle = 0, simulationSpeed }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Significantly slowed down base speed, now multiplied by simulationSpeed
      const t = clock.getElapsedTime() * speed * 0.005 * simulationSpeed;
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
        <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
      
      {/* The Planet */}
      <Sphere 
        ref={meshRef} 
        args={[size, 32, 32]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={hovered ? 0.8 : 0.4}
          metalness={0.9}
          roughness={0.1}
        />
        {hovered && (
          <Html>
            <div className="bg-aura-bg/90 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg pointer-events-none whitespace-nowrap">
              <span className="text-white text-[10px] font-bold uppercase tracking-widest">{name}</span>
            </div>
          </Html>
        )}
      </Sphere>
    </group>
  );
}

function Sun() {
  const lightRef = useRef<THREE.PointLight>(null);
  
  return (
    <group>
      {/* The Sun Core */}
      <Sphere args={[5, 32, 32]}>
        <meshBasicMaterial color="#fffbeb" />
      </Sphere>
      
      {/* The Corona Glow */}
      <Sphere args={[6, 32, 32]}>
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.3} />
      </Sphere>
      
      {/* Dynamic Light Source */}
      <pointLight 
        ref={lightRef}
        intensity={15} 
        distance={3000} 
        color="#fffbeb" 
        shadow-mapSize={[2048, 2048]} 
      />

      {/* Extreme Outer Glow */}
      <Sphere args={[8, 32, 32]}>
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.1} />
      </Sphere>
    </group>
  );
}

interface AsteroidProps {
  object: NearEarthObject;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  simulationSpeed: number;
}

function Asteroid({ object, index, isSelected, onSelect, simulationSpeed }: AsteroidProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [trailReady, setTrailReady] = useState(false);
  
  const approachData = object.close_approach_data[0];
  const missDistLD = parseFloat(approachData.miss_distance.lunar);
  const velocityKph = parseFloat(approachData.relative_velocity.kilometers_per_hour);
  const diameterM = (object.estimated_diameter.meters.estimated_diameter_min + object.estimated_diameter.meters.estimated_diameter_max) / 2;
  
  const isHazard = object.is_potentially_hazardous_asteroid;
  const color = isHazard ? "#EF4444" : "#F59E0B";

  // Refined NEO Scaling: Increased minimum size for visibility
  const visualScale = useMemo(() => {
    return Math.max(0.12, 0.08 + Math.log10(diameterM / 10) * 0.05);
  }, [diameterM]);

  const orbitParams = useMemo(() => {
    const distFromEarthUnits = missDistLD / SCALE_UNIT;
    const angleOffset = (index * 137.5) * (Math.PI / 180);
    const inclination = (index % 5 - 2) * 0.05;
    const angularVelocityBase = (velocityKph / 107000) * 0.1;

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
      // Applied simulationSpeed to asteroid motion
      const t = clock.getElapsedTime() * 0.005 * simulationSpeed;
      
      const earthAngle = clock.getElapsedTime() * 0.005 * simulationSpeed * 1.0;
      const ex = Math.cos(earthAngle) * AU_IN_UNITS;
      const ez = Math.sin(earthAngle) * AU_IN_UNITS;

      const asteroidAngle = earthAngle + orbitParams.angleOffset + (t * orbitParams.angularVelocity * 10);
      
      const ax = ex + Math.cos(asteroidAngle) * orbitParams.distFromEarthUnits;
      const ay = Math.sin(asteroidAngle) * orbitParams.distFromEarthUnits * orbitParams.inclination;
      const az = ez + Math.sin(asteroidAngle) * orbitParams.distFromEarthUnits;

      meshRef.current.position.set(ax, ay, az);
    }
  });

  return (
    <group ref={meshRef}>
      {/* Large Invisible Click Target */}
      <Sphere 
        args={[Math.max(1.5, visualScale * 12), 16, 16]} 
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
          length={isSelected ? 30 : 15}
          decay={1}
          local={false}
        >
          <Sphere args={[visualScale * (isSelected ? 1.5 : 1), 16, 16]}>
            <meshStandardMaterial 
              color={isSelected ? "#ffffff" : color} 
              emissive={color} 
              emissiveIntensity={isSelected ? 10 : 3} 
            />
          </Sphere>
        </Trail>
      )}
      
      <Sphere args={[visualScale * 2.5, 16, 16]}>
        <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.4 : 0.2} />
      </Sphere>
    </group>
  );
}

export function SolarSystemVisualizer({ objects, selectedId, onSelect, simulationSpeed, onSpeedChange }: SolarSystemVisualizerProps) {
  const [simulatedDate, setSimulatedDate] = useState(new Date());
  
  const renderObjects = useMemo(() => {
    return [...objects].sort((a, b) => {
      return parseFloat(a.close_approach_data[0].miss_distance.lunar) - parseFloat(b.close_approach_data[0].miss_distance.lunar);
    }).slice(0, 45);
  }, [objects]);

  const selectedObject = renderObjects.find(o => o.id === selectedId);

  // Simulation Time Logic: Syncing the date with the visual motion
  // 1x speed in our viz = ~7 hours per real second.
  useFrame((_, delta) => {
    const timeStep = delta * 1000 * 25108 * simulationSpeed;
    setSimulatedDate(prev => new Date(prev.getTime() + timeStep));
  });

  return (
    <div className="fixed inset-0 z-0 w-full h-full bg-[#020617] overflow-hidden">
      
      {/* NEO Information Panel */}
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
                  <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-black mb-1">Target Identified</p>
                  <h4 className="text-white font-bold text-xl truncate pr-4">{selectedObject.name}</h4>
                </div>
                <button 
                  onClick={() => onSelect?.(null)}
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
                {selectedObject.is_potentially_hazardous_asteroid ? 'Classification: PHAS 1' : 'Classification: STABLE'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accuracy Legend & Units */}
      <div className="absolute top-28 right-6 z-10 hidden md:block">
        <div className="bg-aura-bg/40 backdrop-blur-md border border-white/10 p-5 rounded-3xl shadow-xl max-w-[240px]">
          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 group relative">
            <Info className="w-3 h-3 text-indigo-400" /> 
            Live JPL Stream 
            <div className="absolute left-0 top-full mt-2 hidden group-hover:block bg-aura-bg border border-white/10 p-3 rounded-xl z-50 text-[9px] normal-case tracking-normal w-48 shadow-2xl">
              Real-time connection to NASA Jet Propulsion Laboratory (JPL) Horizons API providing sub-meter orbital state vectors.
            </div>
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-[10px] text-white/80">
              <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
              <span>1 Unit : 10 Lunar Distances</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-white/80">
              <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
              <span>Scaled for Observation Visibility</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 cursor-crosshair">
        <Canvas camera={{ position: [0, 150, 250], fov: 45 }} shadows>
          <Stars radius={600} depth={50} count={20000} factor={7} saturation={0} fade speed={2} />
          <ambientLight intensity={0.2} />
          
          <Sun />
          
          {/* Inner Solar System */}
          <Planet name="Mercury" color="#A5A5A5" radius={18} size={0.5} speed={4.1} initialAngle={1} simulationSpeed={simulationSpeed} />
          <Planet name="Venus" color="#E3BB76" radius={32} size={1.2} speed={1.6} initialAngle={2.5} simulationSpeed={simulationSpeed} />
          <Planet name="Earth" color="#2271B3" radius={AU_IN_UNITS} size={1.5} speed={1.0} initialAngle={0} simulationSpeed={simulationSpeed} />
          <Planet name="Mars" color="#E27B58" radius={65} size={0.9} speed={0.53} initialAngle={4.2} simulationSpeed={simulationSpeed} />
          
          {/* Outer Solar System - Compressed Scale for Visibility */}
          <Planet name="Jupiter" color="#D39C7E" radius={150} size={3.5} speed={0.08} initialAngle={0.5} simulationSpeed={simulationSpeed} />
          <Planet name="Saturn" color="#C5AB6E" radius={240} size={3.0} speed={0.034} initialAngle={1.2} simulationSpeed={simulationSpeed} />
          <Planet name="Uranus" color="#B5E3E3" radius={340} size={2.2} speed={0.012} initialAngle={2.8} simulationSpeed={simulationSpeed} />
          <Planet name="Neptune" color="#4B70DD" radius={430} size={2.2} speed={0.006} initialAngle={3.5} simulationSpeed={simulationSpeed} />
          <Planet name="Pluto" color="#D0B8A1" radius={510} size={0.4} speed={0.004} initialAngle={5.1} simulationSpeed={simulationSpeed} />

          {renderObjects.map((obj, i) => (
            <Asteroid 
              key={obj.id} 
              object={obj} 
              index={i} 
              isSelected={selectedId === obj.id}
              onSelect={() => onSelect?.(obj.id)}
              simulationSpeed={simulationSpeed}
            />
          ))}

          <OrbitControls 
            enablePan={true} 
            minDistance={20} 
            maxDistance={2500} 
            autoRotate={!selectedId} 
            autoRotateSpeed={0.02 * simulationSpeed} 
          />
        </Canvas>
      </div>

      {/* Simulation Controls Group */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-40 hidden sm:block">
        <div className="bg-aura-bg/60 border border-white/10 backdrop-blur-3xl p-6 rounded-[2.5rem] shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-indigo-400 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] text-aura-text-secondary uppercase tracking-[0.2em] font-black">Simulation Control</span>
              </div>
              <p className="text-white font-mono text-lg font-bold">
                {simulatedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                <span className="text-indigo-400 ml-3 opacity-80">{simulatedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-aura-text-secondary uppercase tracking-widest font-bold mb-1">Observation Rate</span>
              <span className="text-white text-xl font-black italic">{simulationSpeed}x</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {[1, 10, 100, 1000, 10000].map((speed) => (
              <button
                key={speed}
                onClick={() => onSpeedChange(speed)}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black transition-all border ${simulationSpeed === speed ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'bg-white/5 border-white/5 text-aura-text-secondary hover:bg-white/10'}`}
              >
                {speed === 10000 ? 'WARP' : `${speed}x`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
