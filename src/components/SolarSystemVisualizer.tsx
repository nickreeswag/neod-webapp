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
  simulatedDate: Date;
  setSimulatedDate: React.Dispatch<React.SetStateAction<Date>>;
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
  periodFactor: number;
  initialAngle?: number;
  simulatedTime: number;
}

function Planet({ name, color, radius, size, periodFactor, initialAngle = 0, simulatedTime }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const angle = useMemo(() => {
    const period = EARTH_YEAR_MS * periodFactor;
    return (simulatedTime / period) * Math.PI * 2 + initialAngle;
  }, [simulatedTime, periodFactor, initialAngle]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    }
  }, [angle, radius]);

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.01;
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
            <div className="bg-aura-bg/90 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg pointer-events-none whitespace-nowrap shadow-2xl">
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

export function SolarSystemVisualizer({ objects, selectedId, onSelect, simulationSpeed, simulatedDate, setSimulatedDate }: SolarSystemVisualizerProps) {
  const selectedMeshPos = useRef<THREE.Vector3>(new THREE.Vector3());
  
  const renderObjects = useMemo(() => {
    return [...objects].sort((a, b) => {
      return parseFloat(a.close_approach_data[0].miss_distance.lunar) - parseFloat(b.close_approach_data[0].miss_distance.lunar);
    }).slice(0, 45);
  }, [objects]);

  const selectedObject = renderObjects.find(o => o.id === selectedId);

  return (
    <div className="fixed inset-0 z-0 w-full h-full bg-[#020617] overflow-hidden">
      
      <div className="absolute inset-0 cursor-crosshair">
        <Canvas camera={{ position: [0, 200, 300], fov: 45 }} shadows dpr={[1, 2]}>
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
    </div>
  );
}
