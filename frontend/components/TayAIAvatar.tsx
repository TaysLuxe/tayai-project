'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface TayAIAvatarProps {
  /** Size in pixels (default 80) */
  size?: number;
  className?: string;
  /** Animation state: 'idle' | 'listening' | 'speaking' | 'thinking' */
  state?: 'idle' | 'listening' | 'speaking' | 'thinking';
}

// ============================================================
// SIMPLEX NOISE CLASS
// ============================================================
class SimplexNoise {
  private p: Uint8Array;
  private perm: Uint8Array;
  private permMod12: Uint8Array;

  constructor(seed: number = Math.random()) {
    this.p = new Uint8Array(256);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);

    for (let i = 0; i < 256; i++) this.p[i] = i;

    let n: number, q: number;
    for (let i = 255; i > 0; i--) {
      seed = (seed * 16807) % 2147483647;
      n = seed % (i + 1);
      q = this.p[i];
      this.p[i] = this.p[n];
      this.p[n] = q;
    }

    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  noise3D(x: number, y: number, z: number): number {
    const F3 = 1 / 3,
      G3 = 1 / 6;
    const grad3: number[][] = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
    ];

    let n0: number, n1: number, n2: number, n3: number;
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s),
      j = Math.floor(y + s),
      k = Math.floor(z + s);
    const t = (i + j + k) * G3;
    const X0 = i - t,
      Y0 = j - t,
      Z0 = k - t;
    const x0 = x - X0,
      y0 = y - Y0,
      z0 = z - Z0;

    let i1: number, j1: number, k1: number, i2: number, j2: number, k2: number;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }

    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;

    const ii = i & 255, jj = j & 255, kk = k & 255;
    const gi0 = this.permMod12[ii + this.perm[jj + this.perm[kk]]];
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]];
    const gi2 = this.permMod12[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]];
    const gi3 = this.permMod12[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]];

    const dot = (g: number[], px: number, py: number, pz: number) => g[0] * px + g[1] * py + g[2] * pz;
    const contrib = (tv: number, gi: number, px: number, py: number, pz: number) =>
      tv < 0 ? 0 : ((tv *= tv), tv * tv * dot(grad3[gi], px, py, pz));

    n0 = contrib(0.6 - x0 * x0 - y0 * y0 - z0 * z0, gi0, x0, y0, z0);
    n1 = contrib(0.6 - x1 * x1 - y1 * y1 - z1 * z1, gi1, x1, y1, z1);
    n2 = contrib(0.6 - x2 * x2 - y2 * y2 - z2 * z2, gi2, x2, y2, z2);
    n3 = contrib(0.6 - x3 * x3 - y3 * y3 - z3 * z3, gi3, x3, y3, z3);

    return 32 * (n0 + n1 + n2 + n3);
  }
}

// State configurations
const stateConfigs = {
  idle: {
    noiseStrength: 0.12,
    noiseSpeed: 0.3,
    noiseScale: 1.2,
    rotationSpeed: 0.002,
    lineOpacity: 0.5,
    glowIntensity: 0.15,
    color1: new THREE.Color(0xec4899),
    color2: new THREE.Color(0x8b5cf6),
    lineColor: new THREE.Color(0xd946ef),
  },
  listening: {
    noiseStrength: 0.2,
    noiseSpeed: 0.5,
    noiseScale: 1.5,
    rotationSpeed: 0.004,
    lineOpacity: 0.7,
    glowIntensity: 0.25,
    color1: new THREE.Color(0x06b6d4),
    color2: new THREE.Color(0x3b82f6),
    lineColor: new THREE.Color(0x22d3ee),
  },
  speaking: {
    noiseStrength: 0.35,
    noiseSpeed: 0.8,
    noiseScale: 2.0,
    rotationSpeed: 0.006,
    lineOpacity: 0.85,
    glowIntensity: 0.4,
    color1: new THREE.Color(0xa855f7),
    color2: new THREE.Color(0xec4899),
    lineColor: new THREE.Color(0xc084fc),
  },
  thinking: {
    noiseStrength: 0.18,
    noiseSpeed: 1.5,
    noiseScale: 1.8,
    rotationSpeed: 0.012,
    lineOpacity: 0.6,
    glowIntensity: 0.2,
    color1: new THREE.Color(0xfbbf24),
    color2: new THREE.Color(0xf97316),
    lineColor: new THREE.Color(0xfcd34d),
  },
};

interface OriginalPoint {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
}

interface LineData {
  mesh: THREE.Line;
  original: OriginalPoint[];
  type: 'lat' | 'lon';
}

/**
 * Animated TayAI avatar: 3D wireframe sphere with noise-based deformation.
 */
export default function TayAIAvatar({ size = 80, className = '', state = 'idle' }: TayAIAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    lineGroup: THREE.Group;
    lines: LineData[];
    glowMaterial: THREE.ShaderMaterial;
    outerGlowMaterial: THREE.ShaderMaterial;
    glowMesh: THREE.Mesh;
    noise: SimplexNoise;
    params: {
      noiseStrength: number;
      noiseSpeed: number;
      noiseScale: number;
      rotationSpeed: number;
      lineOpacity: number;
      glowIntensity: number;
    };
    targetParams: {
      noiseStrength: number;
      noiseSpeed: number;
      noiseScale: number;
      rotationSpeed: number;
      lineOpacity: number;
      glowIntensity: number;
    };
    time: number;
    animationId: number;
  } | null>(null);

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const RADIUS = 1.4;
    const LAT_SEGMENTS = 32;
    const LON_SEGMENTS = 48;
    const POINTS_PER_LINE = 64;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const noise = new SimplexNoise();
    const lines: LineData[] = [];
    const lineGroup = new THREE.Group();
    scene.add(lineGroup);

    // Create latitude lines (horizontal circles)
    for (let i = 1; i < LAT_SEGMENTS; i++) {
      const phi = (i / LAT_SEGMENTS) * Math.PI;
      const y = RADIUS * Math.cos(phi);
      const ringRadius = RADIUS * Math.sin(phi);

      const points: THREE.Vector3[] = [];
      const originalPoints: OriginalPoint[] = [];

      for (let j = 0; j <= POINTS_PER_LINE; j++) {
        const theta = (j / POINTS_PER_LINE) * Math.PI * 2;
        const x = ringRadius * Math.cos(theta);
        const z = ringRadius * Math.sin(theta);

        points.push(new THREE.Vector3(x, y, z));
        originalPoints.push({ x, y, z, nx: x / RADIUS, ny: y / RADIUS, nz: z / RADIUS });
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xd946ef,
        transparent: true,
        opacity: 0.6,
      });

      const line = new THREE.Line(geometry, material);
      lineGroup.add(line);
      lines.push({ mesh: line, original: originalPoints, type: 'lat' });
    }

    // Create longitude lines (vertical circles)
    for (let i = 0; i < LON_SEGMENTS; i++) {
      const theta = (i / LON_SEGMENTS) * Math.PI * 2;

      const points: THREE.Vector3[] = [];
      const originalPoints: OriginalPoint[] = [];

      for (let j = 0; j <= POINTS_PER_LINE; j++) {
        const phi = (j / POINTS_PER_LINE) * Math.PI;
        const y = RADIUS * Math.cos(phi);
        const ringRadius = RADIUS * Math.sin(phi);
        const x = ringRadius * Math.cos(theta);
        const z = ringRadius * Math.sin(theta);

        points.push(new THREE.Vector3(x, y, z));
        originalPoints.push({ x, y, z, nx: x / RADIUS || 0, ny: y / RADIUS, nz: z / RADIUS || 0 });
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xd946ef,
        transparent: true,
        opacity: 0.6,
      });

      const line = new THREE.Line(geometry, material);
      lineGroup.add(line);
      lines.push({ mesh: line, original: originalPoints, type: 'lon' });
    }

    // Glow effect (inner sphere)
    const glowGeometry = new THREE.SphereGeometry(RADIUS * 0.98, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor1: { value: new THREE.Color(0xec4899) },
        uColor2: { value: new THREE.Color(0x8b5cf6) },
        uIntensity: { value: 0.15 },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uIntensity;
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          vec3 color = mix(uColor1, uColor2, vPosition.y * 0.5 + 0.5);
          gl_FragColor = vec4(color, fresnel * uIntensity);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowMesh);

    // Outer glow
    const outerGlowGeometry = new THREE.SphereGeometry(RADIUS * 1.3, 32, 32);
    const outerGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x8b5cf6) },
        uIntensity: { value: 0.1 },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        varying vec3 vNormal;
        
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
          gl_FragColor = vec4(uColor, fresnel * uIntensity);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    scene.add(outerGlow);

    // Animation parameters
    const config = stateConfigs[state];
    const params = {
      noiseStrength: config.noiseStrength,
      noiseSpeed: config.noiseSpeed,
      noiseScale: config.noiseScale,
      rotationSpeed: config.rotationSpeed,
      lineOpacity: config.lineOpacity,
      glowIntensity: config.glowIntensity,
    };
    const targetParams = { ...params };

    let time = 0;
    let animationId = 0;

    // Animation loop
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.016;

      // Smooth parameter transitions
      const lerpSpeed = 0.05;
      params.noiseStrength += (targetParams.noiseStrength - params.noiseStrength) * lerpSpeed;
      params.noiseSpeed += (targetParams.noiseSpeed - params.noiseSpeed) * lerpSpeed;
      params.noiseScale += (targetParams.noiseScale - params.noiseScale) * lerpSpeed;
      params.rotationSpeed += (targetParams.rotationSpeed - params.rotationSpeed) * lerpSpeed;
      params.lineOpacity += (targetParams.lineOpacity - params.lineOpacity) * lerpSpeed;
      params.glowIntensity += (targetParams.glowIntensity - params.glowIntensity) * lerpSpeed;

      // Update each line
      lines.forEach((lineData) => {
        const positions = lineData.mesh.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < lineData.original.length; i++) {
          const orig = lineData.original[i];

          // Calculate noise displacement
          const noiseVal = noise.noise3D(
            orig.nx * params.noiseScale + time * params.noiseSpeed * 0.5,
            orig.ny * params.noiseScale + time * params.noiseSpeed * 0.5,
            orig.nz * params.noiseScale + time * params.noiseSpeed * 0.5
          );

          // Secondary noise layer for more organic feel
          const noiseVal2 =
            noise.noise3D(
              orig.nx * params.noiseScale * 2 + time * params.noiseSpeed,
              orig.ny * params.noiseScale * 2 + time * params.noiseSpeed,
              orig.nz * params.noiseScale * 2 + time * params.noiseSpeed
            ) * 0.3;

          const displacement = (noiseVal + noiseVal2) * params.noiseStrength;

          // Apply displacement along normal
          positions[i * 3] = orig.x + orig.nx * displacement;
          positions[i * 3 + 1] = orig.y + orig.ny * displacement;
          positions[i * 3 + 2] = orig.z + orig.nz * displacement;
        }

        lineData.mesh.geometry.attributes.position.needsUpdate = true;
        (lineData.mesh.material as THREE.LineBasicMaterial).opacity = params.lineOpacity;
      });

      // Rotate
      lineGroup.rotation.y += params.rotationSpeed;
      lineGroup.rotation.x = Math.sin(time * 0.2) * 0.1;

      glowMesh.rotation.y = lineGroup.rotation.y;
      glowMesh.rotation.x = lineGroup.rotation.x;

      // Update glow
      glowMaterial.uniforms.uIntensity.value = params.glowIntensity;
      glowMaterial.uniforms.uTime.value = time;
      outerGlowMaterial.uniforms.uIntensity.value = params.glowIntensity * 0.5;

      renderer.render(scene, camera);
    };

    animate();

    // Store refs
    sceneRef.current = {
      scene,
      camera,
      renderer,
      lineGroup,
      lines,
      glowMaterial,
      outerGlowMaterial,
      glowMesh,
      noise,
      params,
      targetParams,
      time,
      animationId,
    };

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      lines.forEach((lineData) => {
        lineData.mesh.geometry.dispose();
        (lineData.mesh.material as THREE.Material).dispose();
      });
      glowGeometry.dispose();
      glowMaterial.dispose();
      outerGlowGeometry.dispose();
      outerGlowMaterial.dispose();
    };
  }, [size]);

  // Handle state changes
  useEffect(() => {
    if (!sceneRef.current) return;

    const config = stateConfigs[state];
    const { targetParams, glowMaterial, outerGlowMaterial, lines } = sceneRef.current;

    targetParams.noiseStrength = config.noiseStrength;
    targetParams.noiseSpeed = config.noiseSpeed;
    targetParams.noiseScale = config.noiseScale;
    targetParams.rotationSpeed = config.rotationSpeed;
    targetParams.lineOpacity = config.lineOpacity;
    targetParams.glowIntensity = config.glowIntensity;

    // Update colors
    glowMaterial.uniforms.uColor1.value.copy(config.color1);
    glowMaterial.uniforms.uColor2.value.copy(config.color2);
    outerGlowMaterial.uniforms.uColor.value.copy(config.color2);

    // Update line colors
    lines.forEach((lineData) => {
      (lineData.mesh.material as THREE.LineBasicMaterial).color.copy(config.lineColor);
    });
  }, [state]);

  return (
    <div
      ref={containerRef}
      className={`relative rounded-full overflow-hidden flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="TayAI"
    />
  );
}
