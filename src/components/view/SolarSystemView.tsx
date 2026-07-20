"use client";

/**
 * @file components/view/SolarSystemView.tsx
 * @description Vue Système Solaire — logique 3D pure (Segment B, v3).
 *
 * Même architecture que SkyMapView :
 * - useUniverseEngine() → scène partagée
 * - useEffect pour construction (jamais useMemo)
 * - Cleanup GPU exhaustif au démontage
 * - Overlay UI uniquement, aucun canvas
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

import { useUniverseEngine } from '@/lib/UniverseEngineContext';
import { useDashboard } from '@/lib/DashboardContext';
import { SOLAR_SYSTEM } from '@/constants';
import { CelestialType, type CelestialBody } from '@/types';

// ═════════════════════════════════════════════════════════════════════════════
// Props
// ═════════════════════════════════════════════════════════════════════════════

interface SolarSystemViewProps {
    onSelect: (body: CelestialBody) => void;
    onHover: (body: CelestialBody | null) => void;
}

// ═════════════════════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════════════════════

/** Calcule le rayon visuel à partir des données de rayon réel en km */
function visualRadius(radiusStr: string | undefined, fallback: number): number {
    if (!radiusStr) return fallback;
    const match = radiusStr.match(/[\d\s]+/);
    if (!match) return fallback;
    const km = parseFloat(match[0].replace(/\s/g, ''));
    if (!km || km <= 0) return fallback;
    const earthRef = 6371;
    const ratio = km / earthRef;
    // Échelle logarithmique : base 8 à 28 unités
    const logRatio = Math.log(ratio + 0.5) / Math.log(12);
    return 8 + Math.max(0, Math.min(1, logRatio)) * 20;
}

/** Rayon orbital en unités 3D selon la distance UA */
function orbitalRadius(index: number, body: CelestialBody): number {
    if (body.id === 'ceres') return 400;
    if (index < 4) return (index + 1) * 70 + 60;           // planètes telluriques
    return (index - 4) * 120 + 550;                          // géantes + kuiper
}

// ═════════════════════════════════════════════════════════════════════════════
// Composant
// ═════════════════════════════════════════════════════════════════════════════

export const SolarSystemView: React.FC<SolarSystemViewProps> = ({ onSelect, onHover }) => {
    const { scene, camera, renderer, registerAnimation, isReady } = useUniverseEngine();
    const {
        orientation, setOrientation,
        zoom,
        showGrid,
        showMilkyWay,
        perspectiveMode,
        isMeasuringMode, distancePoints, addDistancePoint,
    } = useDashboard();

    const controlsRef = useRef<OrbitControls | null>(null);
    const laserRef = useRef<THREE.Line | null>(null);

    type PlanetEntry = {
        mesh: THREE.Mesh;
        glow: THREE.Mesh;
        orbitRing: THREE.Mesh;
        body: CelestialBody;
        orbit: number;
        speed: number;
        angle: number;
    };
    const planetsRef = useRef<PlanetEntry[]>([]);
    const sunRef = useRef<{ mesh: THREE.Mesh; glow: THREE.Mesh } | null>(null);
    const gridGroupRef = useRef<THREE.Group | null>(null);
    const mwPointsRef = useRef<THREE.Points | null>(null);

    // ── Construction de la scène ──────────────────────────────────────────────
    useEffect(() => {
        if (!isReady) return;

        scene.clear();
        if (camera.current) {
            camera.current.fov = 45;
            camera.current.position.set(0, 0, 1200);
            camera.current.updateProjectionMatrix();
        }

        const disposables: THREE.BufferGeometry[] = [];
        const disposableMats: THREE.Material[] = [];

        // ── 1. Starfield de fond ────────────────────────────────────────────
        const STAR_COUNT = 8000;
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(STAR_COUNT * 3);
        for (let i = 0; i < STAR_COUNT; i++) {
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = 2 * Math.PI * Math.random();
            const r = 9000;
            starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
            starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            starPos[i * 3 + 2] = r * Math.cos(phi);
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        disposables.push(starGeo);
        const starMat = new THREE.PointsMaterial({
            color: 0xffffff, size: 1.2, transparent: true, opacity: 0.25, sizeAttenuation: false
        });
        disposableMats.push(starMat);
        scene.add(new THREE.Points(starGeo, starMat));

        // ── 2. Lumières ──────────────────────────────────────────────────────
        const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambient);
        const sunLight = new THREE.PointLight(0xffdd88, 10, 6000);
        scene.add(sunLight);

        // ── 3. Voie Lactée (fond diffus) ─────────────────────────────────────
        const MW_COUNT = 2500;
        const mwPos = new Float32Array(MW_COUNT * 3);
        for (let i = 0; i < MW_COUNT; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 4000 + Math.random() * 600;
            mwPos[i * 3]     = r * Math.cos(a);
            mwPos[i * 3 + 1] = (Math.random() - 0.5) * 500;
            mwPos[i * 3 + 2] = r * Math.sin(a);
        }
        const mwGeo = new THREE.BufferGeometry();
        mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPos, 3));
        disposables.push(mwGeo);
        const mwMat = new THREE.PointsMaterial({
            size: 80, color: 0x3355bb, transparent: true, opacity: 0.08,
            blending: THREE.AdditiveBlending, sizeAttenuation: true,
        });
        disposableMats.push(mwMat);
        const mwPoints = new THREE.Points(mwGeo, mwMat);
        scene.add(mwPoints);
        mwPointsRef.current = mwPoints;

        // ── 4. Grille écliptique ─────────────────────────────────────────────
        const gridGroup = new THREE.Group();
        const gridMat = new THREE.MeshBasicMaterial({
            color: 0x4deeea, transparent: true, opacity: 0.015, side: THREE.DoubleSide
        });
        disposableMats.push(gridMat);
        const ringGeo = new THREE.RingGeometry(180, 1500, 72);
        disposables.push(ringGeo);
        const gridRing = new THREE.Mesh(ringGeo, gridMat);
        gridRing.rotation.x = Math.PI / 2;
        gridGroup.add(gridRing);
        scene.add(gridGroup);
        gridGroupRef.current = gridGroup;

        // ── 5. Ceintures d'astéroïdes ────────────────────────────────────────
        const createBelt = (rMin: number, rMax: number, count: number, color: number, opacity: number) => {
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = rMin + Math.random() * (rMax - rMin);
                pos[i * 3]     = Math.cos(a) * r;
                pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
                pos[i * 3 + 2] = Math.sin(a) * r;
            }
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            disposables.push(geo);
            const mat = new THREE.PointsMaterial({ color, size: 1.0, transparent: true, opacity });
            disposableMats.push(mat);
            scene.add(new THREE.Points(geo, mat));
        };
        createBelt(365, 435, 3000, 0x888888, 0.4);  // Ceinture principale
        createBelt(920, 1180, 4000, 0x4466aa, 0.25); // Ceinture de Kuiper (simplifiée)

        // ── 6. Soleil ────────────────────────────────────────────────────────
        const sunGeo = new THREE.SphereGeometry(38, 64, 64);
        disposables.push(sunGeo);
        const sunMat = new THREE.MeshStandardMaterial({
            color: 0xffdd00, emissive: 0xffaa00, emissiveIntensity: 2.5,
            roughness: 0.8,
        });
        disposableMats.push(sunMat);
        const sunMesh = new THREE.Mesh(sunGeo, sunMat);
        sunMesh.userData = { body: SOLAR_SYSTEM[0] };
        scene.add(sunMesh);

        const sunGlowGeo = new THREE.SphereGeometry(55, 32, 32);
        disposables.push(sunGlowGeo);
        const sunGlowMat = new THREE.MeshBasicMaterial({
            color: 0xff9900, transparent: true, opacity: 0.25,
            blending: THREE.AdditiveBlending,
        });
        disposableMats.push(sunGlowMat);
        const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
        sunGlow.userData = { body: SOLAR_SYSTEM[0] };
        scene.add(sunGlow);

        const sunHitGeo = new THREE.SphereGeometry(100, 8, 8);
        disposables.push(sunHitGeo);
        const sunHitMat = new THREE.MeshBasicMaterial({ visible: false });
        disposableMats.push(sunHitMat);
        const sunHitMesh = new THREE.Mesh(sunHitGeo, sunHitMat);
        sunHitMesh.userData = { body: SOLAR_SYSTEM[0] };
        scene.add(sunHitMesh);

        sunRef.current = { mesh: sunMesh, glow: sunGlow };

        // ── 7. Planètes ──────────────────────────────────────────────────────
        const planets: PlanetEntry[] = [];
        SOLAR_SYSTEM.slice(1).forEach((planet, idx) => {
            const orbitR = orbitalRadius(idx, planet);
            const size = visualRadius(planet.properties.radius, 12 + idx);

            // Anneau orbital
            const ringGeo = new THREE.RingGeometry(orbitR - 0.8, orbitR + 0.8, 128);
            disposables.push(ringGeo);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xffffff, transparent: true, opacity: 0.12, side: THREE.DoubleSide
            });
            disposableMats.push(ringMat);
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            scene.add(ring);

            // Planète
            const pGeo = new THREE.SphereGeometry(size, 32, 32);
            disposables.push(pGeo);
            const pMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(planet.colors[0]),
                emissive: new THREE.Color(planet.colors[0]),
                emissiveIntensity: 0.8,
                roughness: 0.7,
                metalness: planet.type === CelestialType.DWARF_PLANET ? 0.3 : 0.0,
            });
            disposableMats.push(pMat);
            const pMesh = new THREE.Mesh(pGeo, pMat);
            pMesh.userData = { body: planet };
            scene.add(pMesh);

            // Lueur planète (zone de détection étendue)
            const pGlowGeo = new THREE.SphereGeometry(size * 2.2, 16, 16);
            disposables.push(pGlowGeo);
            const pGlowMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(planet.colors[0]),
                transparent: true, opacity: 0.06,
                blending: THREE.AdditiveBlending,
            });
            disposableMats.push(pGlowMat);
            const pGlow = new THREE.Mesh(pGlowGeo, pGlowMat);
            pGlow.userData = { body: planet };
            scene.add(pGlow);

            // Sphere de détection invisible (hitbox 50-90 units)
            const hitR = Math.max(size * 4, 50);
            const pHitGeo = new THREE.SphereGeometry(hitR, 8, 8);
            disposables.push(pHitGeo);
            const pHitMat = new THREE.MeshBasicMaterial({ visible: false });
            disposableMats.push(pHitMat);
            const pHitMesh = new THREE.Mesh(pHitGeo, pHitMat);
            pHitMesh.userData = { body: planet };
            pMesh.add(pHitMesh);

            // Anneaux de Saturne
            if (planet.id === 'saturn') {
                const satRingGeo = new THREE.RingGeometry(size * 1.5, size * 2.8, 64);
                disposables.push(satRingGeo);
                const satRingMat = new THREE.MeshBasicMaterial({
                    color: 0xf4d47a, transparent: true, opacity: 0.5,
                    side: THREE.DoubleSide,
                });
                disposableMats.push(satRingMat);
                const satRing = new THREE.Mesh(satRingGeo, satRingMat);
                satRing.rotation.x = Math.PI * 0.45;
                satRing.userData = { body: planet };
                pMesh.add(satRing);
            }

            planets.push({
                mesh: pMesh,
                glow: pGlow,
                orbitRing: ring,
                body: planet,
                orbit: orbitR,
                speed: 0.003 / Math.max(0.01, orbitR * 0.01),
                angle: Math.random() * Math.PI * 2,
            });
        });
        planetsRef.current = planets;

        // ── 8. Laser de mesure ───────────────────────────────────────────────
        const laserGeo = new THREE.BufferGeometry();
        laserGeo.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0, 0,0,0], 3));
        disposables.push(laserGeo);
        const laserMat = new THREE.LineBasicMaterial({
            color: 0x4deeea, transparent: true, opacity: 0.85,
            blending: THREE.AdditiveBlending,
        });
        disposableMats.push(laserMat);
        const laser = new THREE.Line(laserGeo, laserMat);
        laser.visible = false;
        scene.add(laser);
        laserRef.current = laser;

        // ── Cleanup ───────────────────────────────────────────────────────────
        return () => {
            disposables.forEach(g => g.dispose());
            disposableMats.forEach(m => m.dispose());
            scene.clear();
            planetsRef.current = [];
            sunRef.current = null;
            gridGroupRef.current = null;
            mwPointsRef.current = null;
            laserRef.current = null;
        };
    }, [isReady, scene, camera]);

    // ── OrbitControls ─────────────────────────────────────────────────────────
    useEffect(() => {
        const cam = camera.current;
        const rend = renderer.current;
        if (!rend || !cam || perspectiveMode !== 'free') {
            controlsRef.current?.dispose();
            controlsRef.current = null;
            return;
        }
        const controls = new OrbitControls(cam, rend.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 150;
        controls.maxDistance = 5000;
        controlsRef.current = controls;
        return () => { controls.dispose(); controlsRef.current = null; };
    }, [perspectiveMode, camera, renderer]);

    // ── Boucle d'animation ────────────────────────────────────────────────────
    useEffect(() => {
        if (!isReady) return;
        const planets = planetsRef.current;
        let hoveredId: string | null = null;
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const cleanupAnim = registerAnimation((time, scene, cam) => {
            // Contrôle caméra
            if (perspectiveMode === 'heliocentric') {
                scene.rotation.x = THREE.MathUtils.lerp(
                    scene.rotation.x, THREE.MathUtils.degToRad(orientation.inclination), 0.05
                );
                scene.rotation.y = THREE.MathUtils.lerp(
                    scene.rotation.y, THREE.MathUtils.degToRad(orientation.rotation), 0.05
                );
                const effectiveZoom = zoom <= 0 ? (0.3 + zoom * 0.7) : zoom;
                const targetZ = 1200 / Math.max(0.05, effectiveZoom);
                cam.position.z = THREE.MathUtils.lerp(cam.position.z, targetZ, 0.05);
            } else {
                controlsRef.current?.update();
                scene.rotation.x = THREE.MathUtils.lerp(scene.rotation.x, 0, 0.05);
                scene.rotation.y = THREE.MathUtils.lerp(scene.rotation.y, 0, 0.05);
            }

            // Layers
            if (gridGroupRef.current) gridGroupRef.current.visible = showGrid;
            if (mwPointsRef.current) mwPointsRef.current.visible = showMilkyWay;

            // Animation Soleil
            if (sunRef.current) {
                const isHov = hoveredId === SOLAR_SYSTEM[0].id;
                const s = sunRef.current;
                s.mesh.rotation.y += 0.004;
                s.mesh.scale.setScalar(THREE.MathUtils.lerp(s.mesh.scale.x, isHov ? 1.3 : 1.0, 0.1));
                s.glow.scale.copy(s.mesh.scale);
                (s.glow.material as THREE.MeshBasicMaterial).opacity =
                    THREE.MathUtils.lerp((s.glow.material as THREE.MeshBasicMaterial).opacity, isHov ? 0.5 : 0.25, 0.1);
            }

            // Animation planètes
            planets.forEach(p => {
                p.angle += p.speed;
                const x = Math.cos(p.angle) * p.orbit;
                const z = Math.sin(p.angle) * p.orbit;
                p.mesh.position.set(x, 0, z);
                p.glow.position.set(x, 0, z);
                p.mesh.rotation.y += 0.008;

                const isHov = hoveredId === p.body.id;
                const targetScale = isHov ? 1.6 : 1.0;
                p.mesh.scale.setScalar(THREE.MathUtils.lerp(p.mesh.scale.x, targetScale, 0.12));
                p.glow.scale.copy(p.mesh.scale);

                const pMat = p.mesh.material as THREE.MeshStandardMaterial;
                pMat.emissiveIntensity = THREE.MathUtils.lerp(pMat.emissiveIntensity, isHov ? 3.0 : 0.8, 0.1);
                const gMat = p.glow.material as THREE.MeshBasicMaterial;
                gMat.opacity = THREE.MathUtils.lerp(gMat.opacity, isHov ? 0.5 : 0.06, 0.1);
                const rMat = p.orbitRing.material as THREE.MeshBasicMaterial;
                rMat.opacity = THREE.MathUtils.lerp(rMat.opacity, isHov ? 0.5 : 0.12, 0.1);
            });

            // Laser de mesure
            const laser = laserRef.current;
            if (laser) {
                if (isMeasuringMode && distancePoints.length === 2) {
                    const getPos = (body: CelestialBody): THREE.Vector3 | null => {
                        if (body.id === 'sun') return sunRef.current?.mesh.position.clone() ?? null;
                        return planets.find(p => p.body.id === body.id)?.mesh.position.clone() ?? null;
                    };
                    const posA = getPos(distancePoints[0]);
                    const posB = getPos(distancePoints[1]);
                    if (posA && posB) {
                        laser.geometry.setAttribute('position', new THREE.Float32BufferAttribute([
                            posA.x, posA.y, posA.z,
                            posB.x, posB.y, posB.z,
                        ], 3));
                        laser.geometry.attributes.position.needsUpdate = true;
                        laser.visible = true;
                    }
                } else {
                    laser.visible = false;
                }
            }

            void time;
        });

        // ── Interactions ───────────────────────────────────────────────────
        const handleMove = (e: MouseEvent) => {
            const rend = renderer.current;
            const cam = camera.current;
            if (!rend || !cam) return;

            // Éviter le survol 3D si la souris pointe sur un panneau UI interactif
            const targetEl = e.target as HTMLElement | null;
            if (targetEl?.closest('button, input, a, aside, nav, .pointer-events-auto')) {
                if (hoveredId !== null) {
                    hoveredId = null;
                    onHover(null);
                    if (rend) rend.domElement.style.cursor = 'default';
                }
                return;
            }

            const rect = rend.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, cam);

            const hits = raycaster.intersectObjects(scene.children, true);
            const hit = hits.find(h => h.object.userData.body);
            const body = hit ? (hit.object.userData.body as CelestialBody) : null;

            if (hoveredId !== (body?.id ?? null)) {
                hoveredId = body?.id ?? null;
                onHover(body);
                if (rend) rend.domElement.style.cursor = body ? 'pointer' : 'default';
            }
        };

        const handleClick = (e: MouseEvent) => {
            const rend = renderer.current;
            const cam = camera.current;
            if (!rend || !cam) return;

            // Ne pas intercepter le clic si l'utilisateur cliquait sur une UI
            const targetEl = e.target as HTMLElement | null;
            if (targetEl?.closest('button, input, a, aside, nav, .pointer-events-auto')) {
                return;
            }

            const rect = rend.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, cam);

            const hits = raycaster.intersectObjects(scene.children, true);
            const hit = hits.find(h => h.object.userData.body);
            if (hit) {
                const body = hit.object.userData.body as CelestialBody;
                if (isMeasuringMode) addDistancePoint(body);
                else onSelect(body);
            }
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('click', handleClick);

        return () => {
            cleanupAnim();
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('click', handleClick);
        };
    }, [
        isReady, registerAnimation, onHover, onSelect,
        orientation, zoom, showGrid, showMilkyWay, perspectiveMode,
        isMeasuringMode, distancePoints, addDistancePoint,
        camera, renderer, scene,
    ]);

    // ── Drag orientation hélio ────────────────────────────────────────────────
    useEffect(() => {
        const el = renderer.current?.domElement;
        if (!el || perspectiveMode === 'free') return;
        let dragging = false, last = { x: 0, y: 0 };
        const onDown = (e: MouseEvent) => { dragging = true; last = { x: e.clientX, y: e.clientY }; };
        const onMove = (e: MouseEvent) => {
            if (!dragging) return;
            let rot = orientation.rotation + (e.clientX - last.x) * 0.5;
            if (rot > 180) rot -= 360;
            if (rot < -180) rot += 360;
            const inc = Math.max(0, Math.min(90, orientation.inclination - (e.clientY - last.y) * 0.3));
            setOrientation({ rotation: rot, inclination: inc });
            last = { x: e.clientX, y: e.clientY };
        };
        const onUp = () => { dragging = false; };
        el.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove, { passive: true });
        window.addEventListener('mouseup', onUp);
        return () => {
            el.removeEventListener('mousedown', onDown);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [renderer, orientation, setOrientation, perspectiveMode]);

    // ── UI overlay ────────────────────────────────────────────────────────────
    return (
        <div className="absolute inset-0 pointer-events-none select-none">
            {/* En-tête */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 bg-black/80 backdrop-blur-2xl px-10 py-4 rounded-full border border-white/10 shadow-2xl">
                <span className="font-mono text-[8px] uppercase text-white/40 tracking-[0.4em] font-black">Solar System Visualizer</span>
                <span className="font-mono text-[12px] text-[var(--accent-primary)] font-black tracking-[0.2em] uppercase">
                    Sector :: SOL_SYSTEM
                </span>
            </div>

            {/* Brackets HUD */}
            <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-[var(--accent-primary)]/30 rounded-tl-2xl" />
            <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-[var(--accent-primary)]/30 rounded-tr-2xl" />
            <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-[var(--accent-primary)]/30 rounded-bl-2xl" />
            <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-[var(--accent-primary)]/30 rounded-br-2xl" />

            {/* Vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.7)] pointer-events-none" />
        </div>
    );
};
