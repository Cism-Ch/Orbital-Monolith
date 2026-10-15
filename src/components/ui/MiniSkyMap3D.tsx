"use client";

/**
 * @file components/ui/MiniSkyMap3D.tsx
 * @description Mini structure 3D d'étoiles purement composée de points (THREE.Points).
 *
 * Utilise strictement le code et le jeu de données existants de SkyMapView.tsx :
 * - Fonction de projection sphérique toSphere(x, y, r) identique à SkyMapView.tsx.
 * - Jeu d'étoiles réelles STARS importé depuis @/constants.
 * - Starfield d'arrière-plan en nuage de points (THREE.Points).
 * - Voie Lactée galactique en nuage de points (THREE.Points).
 * - Étoiles du catalogue en points célestes (THREE.Points) multi-couleurs sans maillages ni sphères.
 * - Détection du survol et verrouillage tactile par Raycaster Points.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RotateCcw, ArrowRight, Eye } from 'lucide-react';
import Link from 'next/link';
import { STARS } from '@/constants';
import type { CelestialBody } from '@/types';

export const MiniSkyMap3D: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Étoile active sélectionnée (défaut: Vega ou Sirius)
    const [activeStar, setActiveStar] = useState<CelestialBody>(
        () => STARS.find(s => s.id === 'vega') || STARS[0]
    );
    const [hoveredStar, setHoveredStar] = useState<CelestialBody | null>(null);
    const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);

    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const rootGroupRef = useRef<THREE.Group | null>(null);

    // Drag interaction states
    const isDraggingRef = useRef(false);
    const prevMousePos = useRef({ x: 0, y: 0 });
    const targetRotation = useRef({ x: 0.15, y: 0 });
    const currentRotation = useRef({ x: 0.15, y: 0 });

    // ── Projection RA/Dec → 3D strictement identique à SkyMapView.tsx ──────────
    const toSphere = useCallback((x: number, y: number, r = 1200): THREE.Vector3 => {
        const phi = THREE.MathUtils.degToRad(90 - y);
        const theta = THREE.MathUtils.degToRad(x);
        return new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
        );
    }, []);

    // Passer à l'étoile suivante
    const handleNextTarget = useCallback(() => {
        setActiveStar(prev => {
            const currentIdx = STARS.findIndex(s => s.id === prev.id);
            const nextIdx = (currentIdx + 1) % STARS.length;
            return STARS[nextIdx];
        });
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        let width = container.clientWidth;
        let height = container.clientHeight;

        // 1. Initialisation Scène, Caméra, Renderer
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
        camera.position.set(0, 0, 2400);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current = renderer;

        // 2. Groupe Racine contenant UNIQUEMENT des points (THREE.Points)
        const rootGroup = new THREE.Group();
        scene.add(rootGroup);
        rootGroupRef.current = rootGroup;

        const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

        // ── Helper : Texture circulaire haute résolution pour rendre les points parfaitement ronds ──
        const createCircleTexture = () => {
            const c = document.createElement('canvas');
            c.width = 128;
            c.height = 128;
            const ctx = c.getContext('2d')!;
            ctx.clearRect(0, 0, 128, 128);

            // Dégradé radial doux et lumineux pour un astre sphérique parfait
            const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
            grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
            grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.95)');
            grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.65)');
            grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.2)');
            grad.addColorStop(0.95, 'rgba(255, 255, 255, 0.02)');
            grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(64, 64, 60, 0, Math.PI * 2);
            ctx.fill();

            const tex = new THREE.CanvasTexture(c);
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.generateMipmaps = true;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.needsUpdate = true;
            return tex;
        };

        // Texture d'anneau de ciblage circulaire pour l'étoile active
        const createTargetRingTexture = () => {
            const c = document.createElement('canvas');
            c.width = 128;
            c.height = 128;
            const ctx = c.getContext('2d')!;
            ctx.clearRect(0, 0, 128, 128);

            // Anneau circulaire de visée aérospatiale
            ctx.strokeStyle = 'rgba(77, 238, 234, 0.85)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(64, 64, 52, 0, Math.PI * 2);
            ctx.stroke();

            // Cœur lumineux interne
            const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 30);
            grad.addColorStop(0, 'rgba(77, 238, 234, 0.95)');
            grad.addColorStop(0.5, 'rgba(77, 238, 234, 0.4)');
            grad.addColorStop(1, 'rgba(77, 238, 234, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(64, 64, 30, 0, Math.PI * 2);
            ctx.fill();

            const tex = new THREE.CanvasTexture(c);
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.generateMipmaps = true;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.needsUpdate = true;
            return tex;
        };

        const circleTexture = createCircleTexture();
        const targetRingTexture = createTargetRingTexture();
        disposables.push(circleTexture, targetRingTexture);

        // Helper shader : force géométriquement et mathématiquement chaque point à être 100% rond
        const makeMaterialRound = (material: THREE.PointsMaterial) => {
            material.depthWrite = false;
            material.transparent = true;
            material.onBeforeCompile = (shader) => {
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <clipping_planes_fragment>',
                    `#include <clipping_planes_fragment>
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    if (dist > 0.5) discard;
                    float edgeAlpha = smoothstep(0.5, 0.42, dist);
                    diffuseColor.a *= edgeAlpha;
                    `
                );
            };
        };

        // ── 3. Nuage de points d'étoiles de fond (Identique SkyMapView.tsx) ────
        const BG_STAR_COUNT = 3500;
        const bgStarGeo = new THREE.BufferGeometry();
        const bgStarPos = new Float32Array(BG_STAR_COUNT * 3);
        const bgStarColors = new Float32Array(BG_STAR_COUNT * 3);
        for (let i = 0; i < BG_STAR_COUNT; i++) {
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = 2 * Math.PI * Math.random();
            const r = 3200;
            bgStarPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
            bgStarPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            bgStarPos[i * 3 + 2] = r * Math.cos(phi);
            const t = Math.random();
            bgStarColors[i * 3]     = 0.75 + t * 0.25;
            bgStarColors[i * 3 + 1] = 0.75 + t * 0.15;
            bgStarColors[i * 3 + 2] = 0.8 + (1 - t) * 0.2;
        }
        bgStarGeo.setAttribute('position', new THREE.BufferAttribute(bgStarPos, 3));
        bgStarGeo.setAttribute('color', new THREE.BufferAttribute(bgStarColors, 3));
        disposables.push(bgStarGeo);

        const bgStarMat = new THREE.PointsMaterial({
            size: 2.8,
            vertexColors: true,
            transparent: true,
            opacity: 0.45,
            map: circleTexture,
            sizeAttenuation: false,
            depthWrite: false
        });
        makeMaterialRound(bgStarMat);
        disposables.push(bgStarMat);
        const bgPoints = new THREE.Points(bgStarGeo, bgStarMat);
        rootGroup.add(bgPoints);

        // ── 4. Nuage de points Voie Lactée (Identique SkyMapView.tsx) ──────────
        const MW_COUNT = 3000;
        const mwPos = new Float32Array(MW_COUNT * 3);
        const mwColors = new Float32Array(MW_COUNT * 3);
        for (let i = 0; i < MW_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spread = (Math.random() - 0.5) * 350;
            const r = 1600;
            mwPos[i * 3]     = r * Math.cos(angle) + spread * 0.3;
            mwPos[i * 3 + 1] = (Math.random() - 0.5) * 400;
            mwPos[i * 3 + 2] = r * Math.sin(angle) + spread * 0.3;
            mwColors[i * 3]     = 0.15 + Math.random() * 0.25;
            mwColors[i * 3 + 1] = 0.25 + Math.random() * 0.35;
            mwColors[i * 3 + 2] = 0.65 + Math.random() * 0.35;
        }
        const mwGeo = new THREE.BufferGeometry();
        mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPos, 3));
        mwGeo.setAttribute('color', new THREE.BufferAttribute(mwColors, 3));
        disposables.push(mwGeo);

        const mwMat = new THREE.PointsMaterial({
            size: 32,
            vertexColors: true,
            transparent: true,
            opacity: 0.25,
            map: circleTexture,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            depthWrite: false
        });
        makeMaterialRound(mwMat);
        disposables.push(mwMat);
        const mwPoints = new THREE.Points(mwGeo, mwMat);
        mwPoints.rotation.x = Math.PI * 0.12;
        rootGroup.add(mwPoints);

        // ── 5. Étoiles du catalogue STARS réelles (Points Célestes Ronds) ──────
        const starPositions: number[] = [];
        const starColors: number[] = [];

        STARS.forEach(star => {
            const pos = toSphere(star.position.x, star.position.y, 1200);
            starPositions.push(pos.x, pos.y, pos.z);
            const col = new THREE.Color(star.colors[0] || '#ffffff');
            starColors.push(col.r, col.g, col.b);
        });

        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        starGeo.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
        disposables.push(starGeo);

        const starMat = new THREE.PointsMaterial({
            size: 11,
            vertexColors: true,
            transparent: true,
            opacity: 0.98,
            map: circleTexture,
            sizeAttenuation: false,
            depthWrite: false
        });
        makeMaterialRound(starMat);
        disposables.push(starMat);
        const starPoints = new THREE.Points(starGeo, starMat);
        rootGroup.add(starPoints);

        // ── 6. Pointeur de l'étoile active sélectionnée (Point Rond Pulsant & Anneau) ──
        const activePos = toSphere(activeStar.position.x, activeStar.position.y, 1200);
        const activeGeo = new THREE.BufferGeometry().setFromPoints([activePos]);
        disposables.push(activeGeo);
        const activeMat = new THREE.PointsMaterial({
            size: 26,
            color: 0x4deeea,
            transparent: true,
            opacity: 0.95,
            map: targetRingTexture,
            sizeAttenuation: false,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        makeMaterialRound(activeMat);
        disposables.push(activeMat);
        const activePoint = new THREE.Points(activeGeo, activeMat);
        rootGroup.add(activePoint);

        // ── 7. Interaction Raycaster sur nuage de points (Raycaster Points) ────
        const raycaster = new THREE.Raycaster();
        raycaster.params.Points = { threshold: 45 };
        const pointer = new THREE.Vector2();

        const onPointerMove = (e: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            if (isDraggingRef.current) {
                const deltaX = e.clientX - prevMousePos.current.x;
                const deltaY = e.clientY - prevMousePos.current.y;
                targetRotation.current.y += deltaX * 0.007;
                targetRotation.current.x += deltaY * 0.007;
                prevMousePos.current = { x: e.clientX, y: e.clientY };
            } else {
                raycaster.setFromCamera(pointer, camera);
                const intersects = raycaster.intersectObject(starPoints, false);
                if (intersects.length > 0 && typeof intersects[0].index === 'number') {
                    const starIdx = intersects[0].index;
                    if (STARS[starIdx]) {
                        setHoveredStar(STARS[starIdx]);
                        canvas.style.cursor = 'pointer';
                    }
                } else {
                    setHoveredStar(null);
                    canvas.style.cursor = 'grab';
                }
            }
        };

        const onPointerDown = (e: PointerEvent) => {
            isDraggingRef.current = true;
            prevMousePos.current = { x: e.clientX, y: e.clientY };
            canvas.style.cursor = 'grabbing';

            const rect = canvas.getBoundingClientRect();
            pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(pointer, camera);
            const intersects = raycaster.intersectObject(starPoints, false);
            if (intersects.length > 0 && typeof intersects[0].index === 'number') {
                const starIdx = intersects[0].index;
                if (STARS[starIdx]) {
                    setActiveStar(STARS[starIdx]);
                }
            }
        };

        const onPointerUp = () => {
            isDraggingRef.current = false;
            canvas.style.cursor = 'grab';
        };

        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointerup', onPointerUp);

        // ── 8. Boucle d'Animation RAF ─────────────────────────────────────────
        let animId: number;
        let clock = new THREE.Clock();

        const animate = () => {
            animId = requestAnimationFrame(animate);

            if (isAutoRotate && !isDraggingRef.current) {
                targetRotation.current.y += 0.003;
            }

            currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.08;
            currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.08;

            if (rootGroupRef.current) {
                rootGroupRef.current.rotation.x = currentRotation.current.x;
                rootGroupRef.current.rotation.y = currentRotation.current.y;
            }

            // Pulsation du point cible
            const time = clock.getElapsedTime();
            activeMat.size = 14 + Math.sin(time * 4) * 4;

            renderer.render(scene, camera);
        };

        animate();

        // ── 9. Redimensionnement ──────────────────────────────────────────────
        const onResize = () => {
            if (!containerRef.current) return;
            width = containerRef.current.clientWidth;
            height = containerRef.current.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', onResize);

        // ── 10. Nettoyage ─────────────────────────────────────────────────────
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', onResize);
            canvas.removeEventListener('pointermove', onPointerMove);
            canvas.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointerup', onPointerUp);

            disposables.forEach(d => d.dispose());
            renderer.dispose();
        };
    }, [activeStar.id, isAutoRotate, toSphere]);

    const displayedStar = hoveredStar || activeStar;

    return (
        <div 
            ref={containerRef}
            className="monolith-panel w-full h-[400px] sm:h-[480px] lg:h-[540px] relative overflow-hidden flex flex-col justify-between p-4 sm:p-6 select-none shadow-2xl group border border-white/10 rounded-2xl"
        >
            {/* HUD Corner Brackets Canoniques */}
            <div className="hud-bracket-tl text-[var(--accent-primary)]" />
            <div className="hud-bracket-tr text-[var(--accent-primary)]" />
            <div className="hud-bracket-bl text-[var(--accent-primary)]" />
            <div className="hud-bracket-br text-[var(--accent-primary)]" />

            {/* Canvas WebGL 3D - Nuage de Points */}
            <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full touch-none z-0" 
                style={{ touchAction: 'none' }}
            />

            {/* ── Top Bar HUD : Identification du Nuage de Points ─────────── */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-2.5 bg-black/50 backdrop-blur-md px-3.5 py-2 rounded-xl">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] animate-pulse shadow-[0_0_10px_var(--accent-primary)]" />
                    <div>
                        <span className="text-[8.5px] font-mono font-black uppercase text-white tracking-[0.2em] block">
                            SKYMAP_CORE :: POINT_CLOUD_MATRIX
                        </span>
                        <span className="text-[7px] font-mono text-[#8e8e9f] uppercase">
                            Gaia DR3 Stars / Real Celestial Projection
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsAutoRotate(!isAutoRotate)}
                        className={`px-3.5 py-1.5 rounded-full border text-[8px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer min-h-[36px] flex items-center gap-1.5 ${
                            isAutoRotate 
                                ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--accent-primary)]' 
                                : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                        }`}
                        title="Toggle Auto-Rotation"
                    >
                        <RotateCcw size={10} className={isAutoRotate ? 'animate-spin-slow' : ''} />
                        <span className="hidden xs:inline">{isAutoRotate ? 'Gyro: ON' : 'Gyro: OFF'}</span>
                    </button>

                    <button
                        onClick={handleNextTarget}
                        className="glass-button px-4 py-1.5 text-[8px] font-mono font-bold uppercase text-white hover:text-[var(--accent-primary)] flex items-center gap-1.5 min-h-[36px] !rounded-full cursor-pointer"
                        title="Cycle Celestial Target"
                    >
                        <span>Next Node</span>
                        <ArrowRight size={10} />
                    </button>
                </div>
            </div>

            {/* ── Bottom HUD : Données Réelles de l'Étoile Détectée ─────────── */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-3 border-t border-white/10 bg-black/70 backdrop-blur-xl p-3.5 sm:p-5 rounded-xl sm:rounded-2xl">
                
                {/* Métadonnées Astrophysiques Réelles */}
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div 
                            className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor] flex-shrink-0"
                            style={{ 
                                backgroundColor: displayedStar.colors[0] || '#4deeea',
                                color: displayedStar.colors[0] || '#4deeea'
                            }}
                        />
                        <span className="text-xs sm:text-sm font-black font-mono uppercase text-white tracking-tight">
                            {displayedStar.name}
                        </span>
                        <span className="text-[7.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-[var(--accent-primary)] border border-white/10 uppercase">
                            {displayedStar.scientificName || displayedStar.type}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[8px] sm:text-[8.5px] font-mono text-[#8e8e9f]">
                        <span>CLASS: <strong className="text-white">{displayedStar.properties.spectralClass || 'N/A'}</strong></span>
                        <span>MAG: <strong className="text-amber-400">{displayedStar.properties.magnitude || 'N/A'}</strong></span>
                        <span>DIST: <strong className="text-emerald-400">{displayedStar.distance}</strong></span>
                    </div>
                    
                    <div className="text-[7.5px] font-mono text-[#6c6c7a]">
                        ICRF POS: RA {displayedStar.position.x}° | DEC {displayedStar.position.y}°
                    </div>
                </div>

                {/* Accès direct vers la Vue Céleste */}
                <Link href="/dashboard/map" className="flex-shrink-0">
                    <button className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-black font-mono font-black text-[8.5px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(77,238,234,0.3)] hover:shadow-[0_0_25px_rgba(77,238,234,0.5)] transition-all cursor-pointer touch-target active:scale-95">
                        <Eye size={12} />
                        <span>Lock in Sky Map</span>
                        <ArrowRight size={12} />
                    </button>
                </Link>
            </div>
        </div>
    );
};
