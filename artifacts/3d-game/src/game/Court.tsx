import * as THREE from 'three';
import { GymTheme } from './types';
import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial, Stars as StarField } from '@react-three/drei';

// ─── Classic Gym ──────────────────────────────────────────────────────────────

function ClassicFloor() {
  return (
    <group>
      {/* Varnished hardwood — reflective base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 20]} />
        <MeshReflectorMaterial
          color="#9b6a3e"
          roughness={0.18}
          metalness={0}
          blur={[400, 80]}
          resolution={256}
          mixBlur={8}
          mixStrength={0.6}
          depthScale={1}
          minDepthThreshold={0.5}
          maxDepthThreshold={1.2}
        />
      </mesh>
      {/* Alternating plank strips */}
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-10 + i * 2 + 0.5, 0.005, 0]}>
          <planeGeometry args={[0.9, 20]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#a06840' : '#7e5032'} roughness={0.2} />
        </mesh>
      ))}
      {/* Grain lines */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={`g${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-11 + i * 2, 0.006, 0]}>
          <planeGeometry args={[0.03, 20]} />
          <meshStandardMaterial color="#5a3820" roughness={1} />
        </mesh>
      ))}
      {/* Center circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.8, 2, 64]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.3} />
      </mesh>
      {/* Half-court line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[22, 0.1]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.3} />
      </mesh>
      {/* Paint area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, -7.5]}>
        <planeGeometry args={[4.9, 5.8]} />
        <meshStandardMaterial color="#7a5030" roughness={0.22} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -7.5]}>
        <planeGeometry args={[4.9, 0.1]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.3} />
      </mesh>
    </group>
  );
}

function ClassicArena() {
  return (
    <group>
      {/* Ceiling */}
      <mesh position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[28, 24]} />
        <meshStandardMaterial color="#1c1008" roughness={1} />
      </mesh>

      {/* Industrial trusses */}
      {[-8, -2.5, 2.5, 8].map((x, i) => (
        <group key={i} position={[x, 8.6, 0]}>
          <mesh>
            <boxGeometry args={[0.32, 0.55, 22]} />
            <meshStandardMaterial color="#2a1a0e" metalness={0.5} roughness={0.6} />
          </mesh>
          {/* Cross-brace detail */}
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.12, 0.55, 22]} />
            <meshStandardMaterial color="#221508" metalness={0.5} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Ceiling light fixtures */}
      {[[-5, 8.7, -5], [5, 8.7, -5], [-5, 8.7, 3], [5, 8.7, 3]].map(([x, y, z], i) => (
        <group key={i} position={[x as number, y as number, z as number]}>
          <mesh>
            <boxGeometry args={[1.4, 0.18, 0.48]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.35} />
          </mesh>
          {/* Emissive lens */}
          <mesh position={[0, -0.09, 0]}>
            <boxGeometry args={[1.15, 0.04, 0.34]} />
            <meshStandardMaterial color="#fffde8" emissive="#fff8d0" emissiveIntensity={3.5} roughness={0} />
          </mesh>
          <pointLight position={[0, -0.3, 0]} intensity={2.5} color="#ffeedd" distance={22} decay={2} castShadow />
        </group>
      ))}

      {/* Side walls */}
      <mesh position={[11, 4.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[22, 9]} />
        <meshStandardMaterial color="#1a0f06" roughness={0.95} />
      </mesh>
      <mesh position={[-11, 4.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[22, 9]} />
        <meshStandardMaterial color="#1a0f06" roughness={0.95} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 4.5, -10]}>
        <planeGeometry args={[22, 9]} />
        <meshStandardMaterial color="#120a04" roughness={0.95} />
      </mesh>

      {/* Bleachers — left side */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[-10.5, 0.5 + i * 0.85, 2 - i * 1.5]}>
          <boxGeometry args={[0.55, 0.18, 8]} />
          <meshStandardMaterial color="#3a2510" roughness={0.9} />
        </mesh>
      ))}

      {/* Scene fill lights */}
      <pointLight position={[-5, 7, 0]} intensity={0.5} color="#fffae0" distance={20} />
      <pointLight position={[5, 7, 0]} intensity={0.5} color="#fffae0" distance={20} />
      <pointLight position={[0, 7, -5]} intensity={0.6} color="#fffae0" distance={20} />
    </group>
  );
}

// ─── Outdoor Night Court ──────────────────────────────────────────────────────

function OutdoorFloor() {
  return (
    <group>
      {/* Wet asphalt — subtle night reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <MeshReflectorMaterial
          color="#222222"
          roughness={0.55}
          metalness={0.1}
          blur={[800, 200]}
          resolution={256}
          mixBlur={12}
          mixStrength={0.35}
          depthScale={1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.6}
        />
      </mesh>
      {/* Painted court surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <planeGeometry args={[22, 20]} />
        <meshStandardMaterial color="#2a4a2a" roughness={0.75} />
      </mesh>
      {/* Court lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[1.8, 2, 64]} />
        <meshStandardMaterial color="#f0e060" roughness={0.5} emissive="#c8bb10" emissiveIntensity={0.15} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <planeGeometry args={[22, 0.1]} />
        <meshStandardMaterial color="#f0e060" roughness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -7.5]}>
        <planeGeometry args={[4.9, 5.8]} />
        <meshStandardMaterial color="#1e3a1e" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, -7.5]}>
        <planeGeometry args={[4.9, 0.1]} />
        <meshStandardMaterial color="#f0e060" roughness={0.5} />
      </mesh>
      {/* Cracks */}
      {[[-3, 0.007, -2], [2, 0.007, 3], [-1, 0.007, -5]].map(([x, y, z], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, i * 0.7, 0]} position={[x as number, y as number, z as number]}>
          <planeGeometry args={[0.04, 1.5 + i * 0.4]} />
          <meshStandardMaterial color="#111111" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function OutdoorArena() {
  return (
    <group>
      {/* Moon */}
      <mesh position={[18, 22, -30]}>
        <sphereGeometry args={[2.2, 24, 24]} />
        <meshStandardMaterial color="#f0f4ff" emissive="#dde4ff" emissiveIntensity={0.8} roughness={0.9} />
      </mesh>
      <pointLight position={[18, 22, -30]} intensity={0.4} color="#c0d0ff" distance={120} />

      {/* Overhead fill */}
      <pointLight position={[-8, 10, 4]} intensity={4.0} color="#e8f4ff" distance={40} />
      <pointLight position={[8, 10, 4]} intensity={4.0} color="#e8f4ff" distance={40} />
      <pointLight position={[0, 10, -6]} intensity={3.5} color="#ddf0ff" distance={35} />

      {/* Floodlight poles */}
      {([-9, 9] as number[]).map((x, i) => (
        <group key={i} position={[x, 0, 3]}>
          {/* Pole shaft */}
          <mesh castShadow position={[0, 5, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 10, 16]} />
            <meshPhysicalMaterial color="#999" metalness={0.9} roughness={0.2} clearcoat={0.3} />
          </mesh>
          {/* Arm */}
          <mesh position={[0, 10.1, 0]}>
            <boxGeometry args={[0.6, 0.1, 0.1]} />
            <meshStandardMaterial color="#555" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Lamp housing */}
          <mesh position={[0, 9.9, 0]}>
            <boxGeometry args={[0.6, 0.22, 0.36]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Glowing lens */}
          <mesh position={[0, 9.75, 0]}>
            <boxGeometry args={[0.48, 0.05, 0.24]} />
            <meshStandardMaterial color="#fffde0" emissive="#ffe87a" emissiveIntensity={8} roughness={0} />
          </mesh>
          <pointLight position={[0, 9.6, 0]} intensity={6} color="#fff5c0" distance={35} castShadow />
        </group>
      ))}

      {/* Chain-link fences */}
      {[-11.5, 11.5].map((x, i) => (
        <mesh key={i} position={[x, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[22, 4]} />
          <meshStandardMaterial color="#2a3a2a" roughness={1} transparent opacity={0.4} wireframe />
        </mesh>
      ))}

      <StarField radius={60} depth={30} count={3000} factor={3} saturation={0} fade speed={0.4} />
    </group>
  );
}

// ─── Neon Arcade ──────────────────────────────────────────────────────────────

function ArcadeFloor() {
  return (
    <group>
      {/* Polished chrome — strong reflections */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 20]} />
        <MeshReflectorMaterial
          color="#05050e"
          roughness={0.04}
          metalness={0.9}
          blur={[200, 60]}
          resolution={512}
          mixBlur={3}
          mixStrength={2.0}
          depthScale={1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
        />
      </mesh>
      {/* Glowing grid lines */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={`h${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, -9 + i * 1.8]}>
          <planeGeometry args={[22, 0.05]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={3} roughness={0} />
        </mesh>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={`v${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-11 + i * 2, 0.008, 0]}>
          <planeGeometry args={[0.05, 20]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={3} roughness={0} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, -7.5]}>
        <planeGeometry args={[4.9, 5.8]} />
        <meshStandardMaterial color="#0a0018" roughness={0.1} metalness={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -7.5]}>
        <planeGeometry args={[4.9, 0.08]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={4} roughness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[1.8, 1.88, 64]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={4} roughness={0} />
      </mesh>
    </group>
  );
}

function ArcadeArena() {
  return (
    <group>
      {/* Neon fill lights */}
      <pointLight position={[-6, 7, 0]} intensity={2.0} color="#aa00ff" distance={22} />
      <pointLight position={[6, 7, 0]} intensity={2.0} color="#00ffcc" distance={22} />
      <pointLight position={[0, 8, -5]} intensity={1.8} color="#ff0080" distance={20} />
      <pointLight position={[0, 5, 5]} intensity={1.0} color="#4400ff" distance={18} />

      {/* Dark walls */}
      <mesh position={[11, 4, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[22, 8]} />
        <meshStandardMaterial color="#06040e" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[-11, 4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[22, 8]} />
        <meshStandardMaterial color="#06040e" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0, 4, -10]}>
        <planeGeometry args={[22, 8]} />
        <meshStandardMaterial color="#050310" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0, 8.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 22]} />
        <meshStandardMaterial color="#04030c" roughness={0.7} />
      </mesh>

      {/* Neon wall strips */}
      {[-10.9, 10.9].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.4, 0]} rotation={[0, i === 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
            <planeGeometry args={[22, 0.1]} />
            <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={5} roughness={0} />
          </mesh>
          <mesh position={[x, 7.5, 0]} rotation={[0, i === 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
            <planeGeometry args={[22, 0.1]} />
            <meshStandardMaterial color="#ff00aa" emissive="#ff00aa" emissiveIntensity={5} roughness={0} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.4, -9.9]}>
        <planeGeometry args={[22, 0.1]} />
        <meshStandardMaterial color="#aa00ff" emissive="#aa00ff" emissiveIntensity={5} roughness={0} />
      </mesh>
      <mesh position={[0, 7.5, -9.9]}>
        <planeGeometry args={[22, 0.1]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={5} roughness={0} />
      </mesh>
    </group>
  );
}

// ─── Hoop (shared) ────────────────────────────────────────────────────────────

const NET_COUNT = 16;

function Hoop({
  rimColor = '#e07c24',
  arcade = false,
  netRippling = false,
}: {
  rimColor?: string;
  arcade?: boolean;
  netRippling?: boolean;
}) {
  const netRefs = useRef<(THREE.Mesh | null)[]>(Array(NET_COUNT).fill(null));
  const rippleTime = useRef(0);
  const rippleActive = useRef(false);

  // Pre-compute net strand positions
  const netStrands = useMemo(() => {
    return Array.from({ length: NET_COUNT }, (_, i) => {
      const angle = (i / NET_COUNT) * Math.PI * 2;
      return { angle, x: Math.cos(angle) * 0.23, z: Math.sin(angle) * 0.23 };
    });
  }, []);

  useEffect(() => {
    if (netRippling) {
      rippleTime.current = 0;
      rippleActive.current = true;
    }
  }, [netRippling]);

  useFrame((_, delta) => {
    if (!rippleActive.current) return;
    rippleTime.current += delta;
    const rt = rippleTime.current;
    netRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const phase = (i / NET_COUNT) * Math.PI * 0.8;
      const wave = Math.sin(rt * 14 + phase) * Math.exp(-rt * 5.5);
      const scaleY = 1 + wave * 0.45;
      mesh.scale.y = Math.max(0.3, scaleY);
      mesh.position.y = 2.8 - (scaleY - 1) * 0.15;
    });
    if (rt > 1.2) {
      netRefs.current.forEach((mesh) => {
        if (!mesh) return;
        mesh.scale.y = 1;
        mesh.position.y = 2.8;
      });
      rippleActive.current = false;
    }
  });

  return (
    <group position={[0, 0, -8]}>
      {/* Support pole — brushed metal */}
      <mesh position={[0, 2, -0.6]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 4, 16]} />
        <meshPhysicalMaterial color="#999" metalness={0.95} roughness={0.15} clearcoat={0.3} />
      </mesh>

      {/* Arm */}
      <mesh position={[0, 3.5, -0.35]} castShadow>
        <boxGeometry args={[0.08, 0.08, 0.5]} />
        <meshPhysicalMaterial color="#999" metalness={0.95} roughness={0.15} clearcoat={0.3} />
      </mesh>

      {/* Mounting bracket detail */}
      <mesh position={[0, 3.78, -0.13]}>
        <boxGeometry args={[0.55, 0.14, 0.22]} />
        <meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Back plate — thick structural body behind the board */}
      <mesh position={[0, 3.8, -0.2]} castShadow>
        <boxGeometry args={[1.98, 1.2, 0.06]} />
        <meshStandardMaterial color="#0d0d0d" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Backboard outer frame — raised border with depth */}
      <mesh position={[0, 3.8, -0.1]} castShadow>
        <boxGeometry args={[1.88, 1.1, 0.12]} />
        <meshStandardMaterial
          color={arcade ? rimColor : '#2a2a2a'}
          metalness={0.85}
          roughness={0.2}
          emissive={arcade ? rimColor : '#000'}
          emissiveIntensity={arcade ? 0.45 : 0}
        />
      </mesh>

      {/* Frame inner reveal — slightly recessed dark inset */}
      <mesh position={[0, 3.8, -0.04]}>
        <boxGeometry args={[1.8, 1.04, 0.01]} />
        <meshStandardMaterial color="#111" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Backboard — frosted acrylic glass panel */}
      <mesh position={[0, 3.8, -0.03]}>
        <boxGeometry args={[1.76, 1.02, 0.05]} />
        <meshPhysicalMaterial
          color={arcade ? '#0a0820' : '#ddeeff'}
          roughness={0.0}
          metalness={0.0}
          clearcoat={1.0}
          clearcoatRoughness={0.04}
          transmission={arcade ? 0.5 : 0.82}
          thickness={0.05}
          transparent
          opacity={arcade ? 0.78 : 0.88}
        />
      </mesh>

      {/* Shooter square outline */}
      <lineSegments position={[0, 3.6, -0.02]}>
        <edgesGeometry args={[new THREE.BoxGeometry(0.59, 0.45, 0.001)]} />
        <lineBasicMaterial color={rimColor} linewidth={2} />
      </lineSegments>

      {/* Rim — polished painted steel */}
      <mesh position={[0, 3.05, 0.23]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.23, 0.028, 14, 48]} />
        <meshPhysicalMaterial
          color={rimColor}
          metalness={0.9}
          roughness={0.08}
          clearcoat={0.8}
          clearcoatRoughness={0.05}
          emissive={arcade ? rimColor : '#000'}
          emissiveIntensity={arcade ? 0.3 : 0}
        />
      </mesh>
      {/* Rim hook ring */}
      <mesh position={[0, 3.02, 0.23]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.245, 0.012, 8, 48]} />
        <meshStandardMaterial color="#333" metalness={0.95} roughness={0.35} />
      </mesh>

      {/* Net strands — vertical cords */}
      {netStrands.map(({ x, z }, i) => (
        <mesh
          key={i}
          ref={(el) => { netRefs.current[i] = el; }}
          position={[x, 2.8, z + 0.23]}
        >
          <cylinderGeometry args={[0.005, 0.003, 0.45, 6]} />
          <meshStandardMaterial color="white" transparent opacity={0.75} roughness={1} />
        </mesh>
      ))}

      {/* Horizontal net rings — create the woven mesh look */}
      {([
        { y: 2.965, r: 0.226 },
        { y: 2.75,  r: 0.172 },
        { y: 2.575, r: 0.108 },
      ] as { y: number; r: number }[]).map(({ y, r }, i) => (
        <mesh key={`netring${i}`} position={[0, y, 0.23]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.0048, 6, 36]} />
          <meshStandardMaterial color="white" transparent opacity={0.65} roughness={1} />
        </mesh>
      ))}

      {/* Net bottom opening ring */}
      <mesh position={[0, 2.565, 0.23]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.072, 0.006, 6, 24]} />
        <meshStandardMaterial color="white" transparent opacity={0.6} roughness={1} />
      </mesh>
    </group>
  );
}

// ─── Exported Court ────────────────────────────────────────────────────────────

interface CourtProps {
  gym?: GymTheme;
  netRippling?: boolean;
}

export function Court({ gym = 'classic', netRippling = false }: CourtProps) {
  if (gym === 'outdoor') {
    return (
      <group>
        <OutdoorFloor />
        <Hoop rimColor="#e07c24" netRippling={netRippling} />
        <OutdoorArena />
      </group>
    );
  }
  if (gym === 'arcade') {
    return (
      <group>
        <ArcadeFloor />
        <Hoop rimColor="#ff00ff" netRippling={netRippling} arcade />
        <ArcadeArena />
      </group>
    );
  }
  return (
    <group>
      <ClassicFloor />
      <Hoop rimColor="#e07c24" netRippling={netRippling} />
      <ClassicArena />
    </group>
  );
}
