'use client';

/**
 * Scene3D — a full-viewport WebGL backdrop that reacts to page scroll.
 *
 * Rendered as a FIXED, pointer-events-none canvas behind the page content
 * (content sits at z-10, this at z-0, CSS mesh gradients at -z-10). Because the
 * marketing cards are translucent (bg-white/80 + backdrop-blur), the floating
 * 3D geometry and particles show through as living depth without hurting text
 * contrast.
 *
 * Scroll is read via a passive window listener into a ref and consumed inside
 * useFrame — we do NOT hijack the scroll container (drei ScrollControls), so
 * the normal HTML document keeps scrolling naturally.
 *
 * Respects prefers-reduced-motion (renders nothing) and scales object counts /
 * DPR down on small screens.
 */

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';

/* Brand palette. */
const GREEN = '#22c274';
const DEEP = '#0E6C3C';
const TEAL = '#0F7B8A';
const AQUA = '#3FB3C4';
const GOLD = '#e3c55c';

type ScrollRef = MutableRefObject<number>;

/* A single floating, wobbling solid that also sweeps on Z with scroll. */
function FloatingSolid({
  scroll,
  geometry,
  position,
  color,
  scale = 1,
  zSweep = 6,
  speed = 1,
  distort = 0.35,
}: {
  scroll: ScrollRef;
  geometry: React.ReactNode;
  position: [number, number, number];
  color: string;
  scale?: number;
  zSweep?: number;
  speed?: number;
  distort?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const baseZ = position[2];

  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    const s = scroll.current; // 0..1
    m.rotation.x = t * 0.15 * speed + s * Math.PI;
    m.rotation.y = t * 0.2 * speed + s * Math.PI * 1.5;
    // Sweep from far depth toward the camera as the user scrolls (bold Z motion).
    m.position.z = baseZ + s * zSweep;
    // Gentle vertical bob layered on the Float wrapper.
    m.position.x = position[0] + Math.sin(t * 0.4 * speed) * 0.3;
  });

  return (
    <Float speed={2 * speed} rotationIntensity={1.4} floatIntensity={1.6}>
      <mesh ref={ref} position={position} scale={scale}>
        {geometry}
        <MeshDistortMaterial
          color={color}
          roughness={0.15}
          metalness={0.35}
          distort={distort}
          speed={2.2}
          transparent
          opacity={0.92}
        />
      </mesh>
    </Float>
  );
}

/* The whole object rig; rotates subtly as a unit with scroll for parallax. */
function Rig({ scroll, mobile }: { scroll: ScrollRef; mobile: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const s = scroll.current;
    const t = state.clock.elapsedTime;
    // Bold parallax: the rig yaws and pitches through the scroll.
    g.rotation.y = s * Math.PI * 0.6 + Math.sin(t * 0.1) * 0.08;
    g.rotation.x = s * -0.5;
    g.position.y = s * 2.4; // drift up as you scroll down
    // Camera dolly for depth.
    state.camera.position.z = 9 - s * 2.5;
    state.camera.position.x = Math.sin(s * Math.PI) * 1.2;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      <FloatingSolid
        scroll={scroll}
        position={[-3.2, 1.4, -2]}
        color={GREEN}
        scale={mobile ? 1 : 1.3}
        zSweep={7}
        speed={1}
        geometry={<icosahedronGeometry args={[1, 4]} />}
      />
      <FloatingSolid
        scroll={scroll}
        position={[3.4, -0.6, -3]}
        color={TEAL}
        scale={mobile ? 0.9 : 1.15}
        zSweep={9}
        speed={0.8}
        distort={0.45}
        geometry={<torusGeometry args={[1, 0.38, 32, 96]} />}
      />
      {!mobile && (
        <>
          <FloatingSolid
            scroll={scroll}
            position={[2.2, 2.4, -5]}
            color={AQUA}
            scale={0.8}
            zSweep={11}
            speed={1.3}
            geometry={<torusKnotGeometry args={[0.7, 0.24, 128, 24]} />}
          />
          <FloatingSolid
            scroll={scroll}
            position={[-3.6, -2.2, -4]}
            color={DEEP}
            scale={1}
            zSweep={8}
            speed={0.9}
            distort={0.5}
            geometry={<dodecahedronGeometry args={[1, 0]} />}
          />
          <FloatingSolid
            scroll={scroll}
            position={[0, -3, -6]}
            color={GOLD}
            scale={0.55}
            zSweep={12}
            speed={1.1}
            geometry={<octahedronGeometry args={[1, 0]} />}
          />
        </>
      )}

      {/* Particle drifts — two layers for depth. */}
      <Sparkles count={mobile ? 40 : 90} scale={[14, 10, 8]} size={mobile ? 2 : 3} speed={0.4} color={GREEN} opacity={0.7} />
      <Sparkles count={mobile ? 25 : 55} scale={[12, 8, 6]} size={1.5} speed={0.25} color={AQUA} opacity={0.5} />
    </group>
  );
}

export default function Scene3D() {
  const scroll = useRef(0);
  const [enabled, setEnabled] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return; // honor accessibility preference — no WebGL motion
    setEnabled(true);
    setMobile(window.innerWidth < 768);

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scroll.current = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    const onResize = () => setMobile(window.innerWidth < 768);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const dpr = useMemo<[number, number]>(() => (mobile ? [1, 1.4] : [1, 1.9]), [mobile]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={dpr}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 9], fov: 52 }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[8, 8, 8]} intensity={90} color={GREEN} />
        <pointLight position={[-8, -6, 4]} intensity={60} color={TEAL} />
        <pointLight position={[0, 6, -6]} intensity={50} color={AQUA} />
        <Rig scroll={scroll} mobile={mobile} />
        <fog attach="fog" args={['#04100A', 8, 22]} />
      </Canvas>
    </div>
  );
}
