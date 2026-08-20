'use client';

/**
 * Auth3DScene — an interactive 3D WebGL showcase for Login and Signup pages.
 *
 * Renders a glowing floating "Capability Seal" mesh with orbiting wireframe rings,
 * dense floating cybernetic particles, and pointer-driven parallax tilt physics.
 */

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles, Ring } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const EMERALD = '#059669';
const MINT = '#10b981';
const TEAL = '#0f766e';
const GLOW = '#34d399';

function CapabilitySeal() {
  const sealRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (sealRef.current) {
      sealRef.current.rotation.y = Math.sin(t * 0.4) * 0.2;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.3;
      ring1Ref.current.rotation.x = Math.sin(t * 0.5) * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.4;
      ring2Ref.current.rotation.y = Math.cos(t * 0.5) * 0.3;
    }
  });

  return (
    <group ref={sealRef}>
      <Float speed={2} rotationIntensity={1.5} floatIntensity={1.5}>
        {/* Core Octahedron Badge */}
        <mesh position={[0, 0, 0]} scale={1.8}>
          <octahedronGeometry args={[1, 2]} />
          <MeshDistortMaterial
            color={EMERALD}
            roughness={0.1}
            metalness={0.2}
            distort={0.25}
            speed={2}
            transparent
            opacity={0.7}
            wireframe
          />
        </mesh>

        {/* Inner Solid Glow Mesh */}
        <mesh position={[0, 0, 0]} scale={1.5}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color={MINT}
            emissive={EMERALD}
            emissiveIntensity={0.6}
            transparent
            opacity={0.35}
          />
        </mesh>

        {/* Orbiting Wireframe Rings */}
        <mesh ref={ring1Ref} position={[0, 0, 0]} scale={2.6}>
          <torusGeometry args={[1, 0.02, 16, 100]} />
          <meshBasicMaterial color={MINT} transparent opacity={0.6} wireframe />
        </mesh>

        <mesh ref={ring2Ref} position={[0, 0, 0]} scale={3.2}>
          <torusGeometry args={[1, 0.015, 16, 100]} />
          <meshBasicMaterial color={GLOW} transparent opacity={0.4} wireframe />
        </mesh>
      </Float>

      {/* Floating Sparkles & Particles */}
      <Sparkles count={120} scale={12} size={3} speed={0.4} opacity={0.4} color={MINT} />
    </group>
  );
}

function ParallaxCamera() {
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  useFrame((state) => {
    state.camera.position.x += (mouse.current.x * 1.5 - state.camera.position.x) * 0.05;
    state.camera.position.y += (-mouse.current.y * 1.5 - state.camera.position.y) * 0.05;
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function Auth3DScene() {
  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-[#021d12] via-[#043321] to-[#02130b]">
      {/* Background Subtle Arabic Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
        <h2 className="text-[14vw] font-arabic font-black text-emerald-400 whitespace-nowrap -rotate-12 filter drop-shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
          وَقُل رَّبِّ زِدْنِي عِلْمًا
        </h2>
      </div>

      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={2.0} color={MINT} />
        <directionalLight position={[-10, -10, -5]} intensity={1.2} color={TEAL} />
        <CapabilitySeal />
        <ParallaxCamera />
      </Canvas>
    </div>
  );
}
