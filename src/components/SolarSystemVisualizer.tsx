import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Trail, Stars, Html } from "@react-three/drei";
import { NearEarthObject } from "@/types/nasa";
import { formatNumber } from "@/lib/utils";
import * as THREE from "three";
import { X, Zap, Calendar } from "lucide-react";
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

// Orbital periods in milliseconds
const EARTH_YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

interface PlanetProps {
  name: string;
  color: string;
  radius: number;
  size: number;
  periodFactor: number; // multiplier for Earth's orbital period
  initialAngle?: number;
  simulatedTime: number;
}

function Planet({ name, color, radius, size, periodFactor, initialAngle = 0, simulatedTime }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Derive position directly from simulated time for 100% accuracy
  const angle = useMemo(() => {
    const period = EARTH_YEAR_MS * periodFactor;
    return (simulatedTime / period) * Math.PI * 2 + initialAngle;
  }, [simulatedTime, periodFactor, initialAngle]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
    }
  }, [angle, radius]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.1, radius + 0.1, 128]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
      
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
  return (
    <group>
      <Sphere args={[5, 32, 32]}>
        <meshBasicMaterial color="#fffbeb" />
      </Sphere>
      <Sphere args={[6, 32, 32]}>
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.3} />
      </Sphere>
      <pointLight intensity={15} distance={3000} color="#fffbeb" />
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
  simulatedTime: number;
}

function Asteroid({ object, index, isSelected, onSelect, simulatedTime }: AsteroidProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [trailReady, setTrailReady] = useState(false);
  
  const approachData = object.close_approach_data[0];
  const missDistLD = parseFloat(approachData.miss_distance.lunar);
  const diameterM = (object.estimated_diameter.meters.estimated_diameter_min + object.estimated_diameter.meters.estimated_diameter_max) / 2;
  const isHazard = object.is_potentially_hazardous_asteroid;
  const color = isHazard ? "#EF4444" : "#F59E0B";

  const visualScale = useMemo(() => Math.max(0.12, 0.08 + Math.log10(diameterM / 10) * 0.05), [diameterM]);

  const orbitParams = useMemo(() => {
    const distFromEarthUnits = missDistLD / SCALE_UNIT;
    const angleOffset = (index * 137.5) * (Math.PI / 180);
    const inclination = (index % 5 - 2) * 0.05;
    // Estimated asteroid orbital period based on eccentricity and semi-major axis (simplified)
    const periodFactor = 1.0 + (index % 10) * 0.1; 
    return { distFromEarthUnits, angleOffset, inclination, periodFactor };
  }, [missDistLD, index]);

  useEffect(() => {
    const timer = setTimeout(() => setTrailReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (meshRef.current) {
      const earthAngle = (simulatedTime / EARTH_YEAR_MS) * Math.PI * 2;
      const ex = Math.cos(earthAngle) * AU_IN_UNITS;
      const ez = Math.sin(earthAngle) * AU_IN_UNITS;

      const asteroidAngle = (simulatedTime / (EARTH_YEAR_MS * orbitParams.periodFactor)) * Math.PI * 2 + orbitParams.angleOffset;
      
      const ax = ex + Math.cos(asteroidAngle) * orbitParams.distFromEarthUnits;
      const ay = Math.sin(asteroidAngle) * orbitParams.distFromEarthUnits * orbitParams.inclination;
      const az = ez + Math.sin(asteroidAngle) * orbitParams.distFromEarthUnits;

      meshRef.current.position.set(ax, ay, az);
    }
  }, [simulatedTime, orbitParams]);

  return (
    <group ref={meshRef}>
      <Sphere 
        args={[Math.max(1.5, visualScale * 12), 16, 16]} 
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </Sphere>

      {trailReady && (
        <Trail width={visualScale * 3} color={isSelected ? "#ffffff" : color} length={isSelected ? 30 : 15} decay={1} local={false}>
          <Sphere args={[visualScale * (isSelected ? 1.5 : 1), 16, 16]}>
            <meshStandardMaterial color={isSelected ? "#ffffff" : color} emissive={color} emissiveIntensity={isSelected ? 10 : 3} />
          </Sphere>
        </Trail>
      )}
      
      <Sphere args={[visualScale * 2.5, 16, 16]}>
        <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.4 : 0.2} />
      </Sphere>
    </group>
  );
}

function CameraFocusManager({ targetRef, isSelected }: { targetRef: React.MutableRefObject<THREE.Vector3>, isSelected: boolean }) {
  useFrame((state) => {
    const controls = state.controls as unknown as { target: THREE.Vector3 };
    
    if (isSelected && targetRef.current) {
      if (controls && controls.target) {
        controls.target.lerp(targetRef.current, 0.1);
      }
      
      const idealDist = 40;
      const currentDist = state.camera.position.distanceTo(targetRef.current);
      if (currentDist > idealDist) {
        const direction = new THREE.Vector3().subVectors(state.camera.position, targetRef.current).normalize();
        const targetCamPos = targetRef.current.clone().add(direction.multiplyScalar(idealDist));
        state.camera.position.lerp(targetCamPos, 0.05);
      }
    } else {
      if (controls && controls.target) {
        controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.05);
      }
    }
  });
  return null;
}

function SelectedObjectTracker({ selectedObject, simulatedTime, renderObjects, targetRef }: { selectedObject: NearEarthObject | undefined, simulatedTime: number, renderObjects: NearEarthObject[], targetRef: React.MutableRefObject<THREE.Vector3> }) {
  useFrame(() => {
    if (selectedObject) {
      const earthAngle = (simulatedTime / EARTH_YEAR_MS) * Math.PI * 2;
      const ex = Math.cos(earthAngle) * AU_IN_UNITS;
      const ez = Math.sin(earthAngle) * AU_IN_UNITS;

      const asteroidIndex = renderObjects.findIndex(o => o.id === selectedObject.id);
      const orbitParams = {
        distFromEarthUnits: parseFloat(selectedObject.close_approach_data[0].miss_distance.lunar) / SCALE_UNIT,
        angleOffset: (asteroidIndex * 137.5) * (Math.PI / 180),
        periodFactor: 1.0 + (asteroidIndex % 10) * 0.1
      };

      const asteroidAngle = (simulatedTime / (EARTH_YEAR_MS * orbitParams.periodFactor)) * Math.PI * 2 + orbitParams.angleOffset;
      targetRef.current.set(
        ex + Math.cos(asteroidAngle) * orbitParams.distFromEarthUnits,
        0,
        ez + Math.sin(asteroidAngle) * orbitParams.distFromEarthUnits
      );
    }
  });
  return null;
}

function SimulationTimeManager({ simulationSpeed, setSimulatedDate }: { simulationSpeed: number, setSimulatedDate: React.Dispatch<React.SetStateAction<Date>> }) {
  useFrame((_, delta) => {
    const baseFactor = 8640; 
    const timeStep = delta * 1000 * baseFactor * simulationSpeed;
    setSimulatedDate(prev => new Date(prev.getTime() + timeStep));
  });
  return null;
}

export function SolarSystemVisualizer({ objects, selectedId, onSelect, simulationSpeed, onSpeedChange }: SolarSystemVisualizerProps) {
  const [simulatedDate, setSimulatedDate] = useState(new Date());
  const selectedMeshPos = useRef<THREE.Vector3>(new THREE.Vector3());
  
  const renderObjects = useMemo(() => {
    return [...objects].sort((a, b) => {
      return parseFloat(a.close_approach_data[0].miss_distance.lunar) - parseFloat(b.close_approach_data[0].miss_distance.lunar);
    }).slice(0, 45);
  }, [objects]);

  const selectedObject = renderObjects.find(o => o.id === selectedId);

  return (
    <div className="fixed inset-0 z-0 w-full h-full bg-[#020617] overflow-hidden">
      
      {/* NEO Information Panel */}
      <AnimatePresence>
        {selectedObject && (
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="absolute bottom-20 left-0 w-full px-4 sm:px-0 sm:bottom-auto sm:top-32 sm:right-6 sm:left-auto sm:w-96 z-50 pointer-events-none"
          >
            <div className="bg-aura-bg/95 border border-white/10 backdrop-blur-3xl p-6 rounded-[2rem] shadow-2xl pointer-events-auto">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden border border-white/20">
                     <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-black mb-1">Target Analysis</p>
                    <h4 className="text-white font-bold text-lg truncate w-48">{selectedObject.name}</h4>
                  </div>
                </div>
                <button onClick={() => onSelect?.(null)} className="text-aura-text-secondary hover:text-white transition-colors p-2 bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] text-aura-text-secondary uppercase font-bold mb-1">Relative Miss</p>
                  <p className="text-white font-mono text-xs">{formatNumber(Math.round(parseFloat(selectedObject.close_approach_data[0].miss_distance.lunar)))} LD</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] text-aura-text-secondary uppercase font-bold mb-1">Speed</p>
                  <p className="text-white font-mono text-xs">{formatNumber(Math.round(parseFloat(selectedObject.close_approach_data[0].relative_velocity.kilometers_per_hour)))} km/h</p>
                </div>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-3 h-3 text-indigo-400" />
                  <p className="text-[9px] text-indigo-400 uppercase font-black tracking-widest">Closest Approach</p>
                </div>
                <p className="text-white font-mono text-xs">{selectedObject.close_approach_data[0].close_approach_date_full}</p>
              </div>

              <div className={`px-4 py-3 rounded-xl text-[10px] uppercase tracking-widest font-black text-center border ${selectedObject.is_potentially_hazardous_asteroid ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-green-500/20 border-green-500/30 text-green-400'}`}>
                {selectedObject.is_potentially_hazardous_asteroid ? 'Hazardous Object' : 'Safe Trajectory'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 cursor-crosshair">
        <Canvas camera={{ position: [0, 200, 300], fov: 45 }} shadows>
          <Stars radius={600} depth={50} count={20000} factor={7} saturation={0} fade speed={2} />
          <ambientLight intensity={0.2} />
          <Sun />
          <SimulationTimeManager simulationSpeed={simulationSpeed} setSimulatedDate={setSimulatedDate} />
          <CameraFocusManager targetRef={selectedMeshPos} isSelected={!!selectedId} />
          <SelectedObjectTracker selectedObject={selectedObject} simulatedTime={simulatedDate.getTime()} renderObjects={renderObjects} targetRef={selectedMeshPos} />
          
          <Planet name="Mercury" color="#A5A5A5" radius={18} size={0.5} periodFactor={0.24} simulatedTime={simulatedDate.getTime()} />
          <Planet name="Venus" color="#E3BB76" radius={32} size={1.2} periodFactor={0.615} simulatedTime={simulatedDate.getTime()} />
          <Planet name="Earth" color="#2271B3" radius={AU_IN_UNITS} size={1.5} periodFactor={1.0} simulatedTime={simulatedDate.getTime()} />
          <Planet name="Mars" color="#E27B58" radius={65} size={0.9} periodFactor={1.88} simulatedTime={simulatedDate.getTime()} />
          <Planet name="Jupiter" color="#D39C7E" radius={150} size={3.5} periodFactor={11.86} simulatedTime={simulatedDate.getTime()} />
          <Planet name="Saturn" color="#C5AB6E" radius={240} size={3.0} periodFactor={29.45} simulatedTime={simulatedDate.getTime()} />
          <Planet name="Uranus" color="#B5E3E3" radius={340} size={2.2} periodFactor={84.01} simulatedTime={simulatedDate.getTime()} />
          <Planet name="Neptune" color="#4B70DD" radius={430} size={2.2} periodFactor={164.79} simulatedTime={simulatedDate.getTime()} />
          <Planet name="Pluto" color="#D0B8A1" radius={510} size={0.4} periodFactor={248.09} simulatedTime={simulatedDate.getTime()} />

          {renderObjects.map((obj, i) => (
            <Asteroid 
              key={obj.id} 
              object={obj} 
              index={i} 
              isSelected={selectedId === obj.id}
              onSelect={() => onSelect?.(obj.id)}
              simulatedTime={simulatedDate.getTime()}
            />
          ))}

          <OrbitControls enablePan={true} minDistance={20} maxDistance={2500} autoRotate={!selectedId} autoRotateSpeed={0.05} />
        </Canvas>
      </div>

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
              <span className="text-[10px] text-aura-text-secondary uppercase tracking-widest font-bold mb-1">Time Scalar</span>
              <span className="text-white text-xl font-black italic">{simulationSpeed}x</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {[1, 10, 100, 500, 2500].map((speed) => (
              <button
                key={speed}
                onClick={() => onSpeedChange(speed)}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black transition-all border ${simulationSpeed === speed ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'bg-white/5 border-white/5 text-aura-text-secondary hover:bg-white/10'}`}
              >
                {speed === 2500 ? 'MAX' : `${speed}x`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
