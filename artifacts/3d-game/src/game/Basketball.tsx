import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BallAnimState, GamePhase } from './types';

interface BasketballProps {
  phase: GamePhase;
  ballAnimState: BallAnimState;
  onAnimEnd: () => void;
  onNetRipple?: () => void;
}

const IDLE_X = 0;
const IDLE_Y = 1.4;
const IDLE_Z = 5.5;

const HOOP_X = 0;
const HOOP_Y = 3.05;
const HOOP_Z = -7.77;

// Where ball is at end of phase 1 (just above hoop)
const ABOVE_HOOP_Y = HOOP_Y + 0.9;

// Miss: ball clips the front rim edge, then bounces away
const MISS_TARGET_X = 0.28;
const MISS_TARGET_Y = 3.1;
const MISS_TARGET_Z = -7.5;

const MISS_BOUNCE_X = 0.7;
const MISS_BOUNCE_Y = 3.7;
const MISS_BOUNCE_Z = -6.0;

const MISS_LAND_X = 1.4;
const MISS_LAND_Y = 0.25;
const MISS_LAND_Z = -4.5;

const CAM_ORIGIN = new THREE.Vector3(0, 5.5, 13);
const CAM_ZOOM   = new THREE.Vector3(0, 6.8, 9.5);

function easeIn(t: number): number {
  return t * t;
}

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function lerp3(
  g: THREE.Group,
  x: number, y: number, z: number
) {
  g.position.set(x, y, z);
}

function CameraAnimator({ ballAnimState }: { ballAnimState: BallAnimState }) {
  const { camera } = useThree();
  const camProgress = useRef(0);
  const active = useRef(false);

  useEffect(() => {
    if (ballAnimState === 'success' || ballAnimState === 'miss') {
      camProgress.current = 0;
      active.current = true;
    } else if (ballAnimState === 'idle') {
      active.current = false;
    }
  }, [ballAnimState]);

  useFrame((_, delta) => {
    if (!active.current) {
      camera.position.lerp(CAM_ORIGIN, delta * 2);
      return;
    }

    camProgress.current = Math.min(camProgress.current + delta * 1.0, 1);
    const t = camProgress.current;

    // Zoom in toward hoop during peak (t 0→0.5), zoom out (t 0.5→1)
    const zoomT = t < 0.5
      ? easeIn(t * 2)          // 0→1 as t goes 0→0.5
      : easeOut(1 - (t - 0.5) * 2); // 1→0 as t goes 0.5→1

    const target = new THREE.Vector3().lerpVectors(CAM_ORIGIN, CAM_ZOOM, zoomT * 0.55);
    camera.position.lerp(target, delta * 4);

    if (camProgress.current >= 1) {
      active.current = false;
    }
  });

  return null;
}

export function Basketball({ phase, ballAnimState, onAnimEnd, onNetRipple }: BasketballProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const animProgress = useRef(0);
  const animating = useRef(false);
  const called = useRef(false);
  const netRippleCalled = useRef(false);
  const bobOffset = useRef(0);

  useEffect(() => {
    if (ballAnimState === 'success' || ballAnimState === 'miss') {
      animProgress.current = 0;
      animating.current = true;
      called.current = false;
      netRippleCalled.current = false;
    } else {
      animating.current = false;
    }
  }, [ballAnimState]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const g = groupRef.current;

    if (animating.current) {
      // Speed: success animation is 1.15s, miss is 1.0s
      const speed = ballAnimState === 'success' ? 0.87 : 1.0;
      animProgress.current = Math.min(animProgress.current + delta * speed, 1);
      const t = animProgress.current;

      if (ballAnimState === 'success') {
        // --- PHASE 1 (t 0→0.65): arc up and over to just above the hoop ---
        if (t <= 0.65) {
          const localT = t / 0.65;
          const eased = easeInOut(localT);

          const px = IDLE_X + (HOOP_X - IDLE_X) * eased;
          const pz = IDLE_Z + (HOOP_Z - IDLE_Z) * eased;
          // Arc peaks between player and hoop, ball arrives just ABOVE the rim
          const py =
            IDLE_Y +
            (ABOVE_HOOP_Y - IDLE_Y) * eased +
            4.8 * Math.sin(Math.PI * localT);
          lerp3(g, px, py, pz);

          // Tight backspin during ascent
          g.rotation.x += delta * 14;
          g.rotation.z += delta * 1.5;
        } else {
          // --- PHASE 2 (t 0.65→1): drop cleanly through the hoop ---
          const localT = (t - 0.65) / 0.35;
          const eased = easeIn(localT);

          const startY = ABOVE_HOOP_Y;
          const endY = 1.8; // well below the net
          const py = startY + (endY - startY) * eased;
          lerp3(g, HOOP_X, py, HOOP_Z);

          // Slower spin once through the net
          g.rotation.x += delta * 8;
          g.rotation.z += delta * 1.0;

          // Trigger net ripple when ball is at rim level (~localT 0.42)
          if (!netRippleCalled.current && localT >= 0.35) {
            netRippleCalled.current = true;
            onNetRipple?.();
          }
        }

      } else if (ballAnimState === 'miss') {
        if (t <= 0.55) {
          // --- PHASE 1: arc toward the rim edge ---
          const localT = t / 0.55;
          const eased = easeInOut(localT);

          const px = IDLE_X + (MISS_TARGET_X - IDLE_X) * eased;
          const pz = IDLE_Z + (MISS_TARGET_Z - IDLE_Z) * eased;
          const py =
            IDLE_Y +
            (MISS_TARGET_Y - IDLE_Y) * eased +
            3.2 * Math.sin(Math.PI * localT);
          lerp3(g, px, py, pz);

          g.rotation.z += delta * 10;
          g.rotation.x += delta * 6;

        } else if (t <= 0.75) {
          // --- PHASE 2: sharp bounce up and away from rim ---
          const localT = (t - 0.55) / 0.20;
          const eased = easeOut(localT);

          const px = MISS_TARGET_X + (MISS_BOUNCE_X - MISS_TARGET_X) * eased;
          const pz = MISS_TARGET_Z + (MISS_BOUNCE_Z - MISS_TARGET_Z) * eased;
          // Bounce: quick upward arc
          const py =
            MISS_TARGET_Y +
            (MISS_BOUNCE_Y - MISS_TARGET_Y) * eased +
            0.6 * Math.sin(Math.PI * localT);
          lerp3(g, px, py, pz);

          // Tumble on impact
          g.rotation.z += delta * 18;
          g.rotation.x += delta * 12;

        } else {
          // --- PHASE 3: fall to the floor ---
          const localT = (t - 0.75) / 0.25;
          const eased = easeIn(localT);

          const px = MISS_BOUNCE_X + (MISS_LAND_X - MISS_BOUNCE_X) * eased;
          const pz = MISS_BOUNCE_Z + (MISS_LAND_Z - MISS_BOUNCE_Z) * eased;
          const py = MISS_BOUNCE_Y + (MISS_LAND_Y - MISS_BOUNCE_Y) * eased;
          lerp3(g, px, py, pz);

          g.rotation.z += delta * 9;
          g.rotation.x += delta * 5;
        }
      }

      if (animProgress.current >= 1 && !called.current) {
        called.current = true;
        animating.current = false;
        onAnimEnd();
      }
    } else {
      // Idle bob
      bobOffset.current += delta * 1.6;
      const bobY = Math.sin(bobOffset.current) * 0.07;
      g.position.set(IDLE_X, IDLE_Y + bobY, IDLE_Z);
      g.rotation.y += delta * 0.4;
    }
  });

  return (
    <>
      <CameraAnimator ballAnimState={ballAnimState} />
      <group ref={groupRef} position={[IDLE_X, IDLE_Y, IDLE_Z]}>
        {/* Ball body — physical leather material with clearcoat sheen */}
        <mesh castShadow>
          <sphereGeometry args={[0.24, 32, 32]} />
          <meshPhysicalMaterial
            color="#c85810"
            roughness={0.72}
            metalness={0.0}
            clearcoat={0.18}
            clearcoatRoughness={0.55}
          />
        </mesh>
        {/* Seam line 1 */}
        <mesh>
          <torusGeometry args={[0.245, 0.0065, 8, 48]} />
          <meshStandardMaterial color="#120400" roughness={1} />
        </mesh>
        {/* Seam line 2 — perpendicular */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.245, 0.0065, 8, 48]} />
          <meshStandardMaterial color="#120400" roughness={1} />
        </mesh>
        {/* Seam line 3 — diagonal */}
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[0.245, 0.0045, 8, 48]} />
          <meshStandardMaterial color="#120400" roughness={1} />
        </mesh>
      </group>
    </>
  );
}
