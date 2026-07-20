"use client";

/**
 * @file components/view/SkyMapView.tsx
 * @description Vue Carte Stellaire — logique 3D pure (Segment B, v3).
 *
 * Ce composant :
 * - Consomme useUniverseEngine() pour accéder à la scène 3D partagée
 * - Peuple la scène avec étoiles, Voie Lactée, grille RA/Dec, labels, constellations
 * - Enregistre la boucle d'animation via registerAnimation()
 * - NE crée PAS de canvas (le renderer vit dans le layout)
 * - Rend uniquement l'overlay UI en absolute (contrôles, tooltip constellation)
 *
 * Pattern de construction scène :
 *   useEffect(() => {
 *     if (!isReady) return;
 *     // construire les objets 3D
 *     return () => { // nettoyer la scène }
 *   }, [isReady]);
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { motion, AnimatePresence } from 'framer-motion';
import { Waypoints, Sparkles, Info } from 'lucide-react';

import { useUniverseEngine } from '@/lib/UniverseEngineContext';
import { useDashboard } from '@/lib/DashboardContext';
import { STARS, CONSTELLATIONS } from '@/constants';
import type { CelestialBody } from '@/types';

// ═════════════════════════════════════════════════════════════════════════════
// Props
// ═════════════════════════════════════════════════════════════════════════════

interface SkyMapViewProps {
    onSelect: (body: CelestialBody) => void;
    onHover: (body: CelestialBody | null) => void;
}

// ═════════════════════════════════════════════════════════════════════════════
// Composant
// ═════════════════════════════════════════════════════════════════════════════

export const SkyMapView: React.FC<SkyMapViewProps> = ({ onSelect, onHover }) => {
    const {
        scene, camera, renderer, registerAnimation, isReady,
    } = useUniverseEngine();

    const {
        orientation, setOrientation,
        zoom,
        showGrid,
        showMilkyWay,
        showConstellations, setShowConstellations,
        perspectiveMode,
        isMeasuringMode, distancePoints, addDistancePoint,
    } = useDashboard();

    // ── État UI overlay ────────────────────────────────────────────────────────
    const [hoveredConst, setHoveredConst] = useState<typeof CONSTELLATIONS[0] | null>(null);

    // ── Refs 3D ────────────────────────────────────────────────────────────────
    const controlsRef = useRef<OrbitControls | null>(null);
    const laserRef = useRef<THREE.Line | null>(null);

    // Map étoile id → position 3D (pour constellations et laser)
    const starPosMapRef = useRef<Map<string, THREE.Vector3>>(new Map());

    // Groupes d'étoiles animables
    type StarEntry = {
        group: THREE.Group;
        body: CelestialBody;
        glow: THREE.Mesh;
        label: THREE.Sprite;
    };
    const starEntriesRef = useRef<StarEntry[]>([]);
    const constLinesRef = useRef<{ mesh: THREE.LineSegments; id: string }[]>([]);
    const constGroupRef = useRef<THREE.Group | null>(null);
    const gridGroupRef = useRef<THREE.Group | null>(null);
    const mwPointsRef = useRef<THREE.Points | null>(null);

    // ── Conversion RA/Dec → 3D ────────────────────────────────────────────────
    const toSphere = useCallback((x: number, y: number, r = 2500): THREE.Vector3 => {
        const phi = THREE.MathUtils.degToRad(90 - y);
        const theta = THREE.MathUtils.degToRad(x);
        return new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
        );
    }, []);

    // ── Construction de la scène ──────────────────────────────────────────────
    useEffect(() => {
        if (!isReady) return;

        // Nettoyer la scène et repositionner la caméra
        scene.clear();
        if (camera.current) {
            camera.current.fov = 60;
            camera.current.position.set(0, 0, 1500);
            camera.current.updateProjectionMatrix();
        }

        const disposables: THREE.BufferGeometry[] = [];
        const disposableMats: THREE.Material[] = [];

        // ── 1. Starfield de fond (particules statiques) ─────────────────────
        const BG_STAR_COUNT = 12000;
        const bgStarGeo = new THREE.BufferGeometry();
        const bgStarPos = new Float32Array(BG_STAR_COUNT * 3);
        const bgStarColors = new Float32Array(BG_STAR_COUNT * 3);
        for (let i = 0; i < BG_STAR_COUNT; i++) {
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = 2 * Math.PI * Math.random();
            const r = 8000;
            bgStarPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
            bgStarPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            bgStarPos[i * 3 + 2] = r * Math.cos(phi);
            // Couleurs légèrement variées (blanc chaud / froid)
            const t = Math.random();
            bgStarColors[i * 3]     = 0.8 + t * 0.2;
            bgStarColors[i * 3 + 1] = 0.8 + t * 0.1;
            bgStarColors[i * 3 + 2] = 0.8 + (1 - t) * 0.2;
        }
        bgStarGeo.setAttribute('position', new THREE.BufferAttribute(bgStarPos, 3));
        bgStarGeo.setAttribute('color', new THREE.BufferAttribute(bgStarColors, 3));
        disposables.push(bgStarGeo);
        const bgStarMat = new THREE.PointsMaterial({
            size: 0.8, vertexColors: true, transparent: true,
            opacity: 0.35, sizeAttenuation: false
        });
        disposableMats.push(bgStarMat);
        scene.add(new THREE.Points(bgStarGeo, bgStarMat));

        // ── 2. Grille RA/Dec ────────────────────────────────────────────────
        const gridGroup = new THREE.Group();
        const gridMat = new THREE.LineBasicMaterial({ color: 0x4deeea, transparent: true, opacity: 0.08 });
        disposableMats.push(gridMat);
        // Lignes de déclinaison (24 méridiens)
        for (let i = 0; i < 24; i++) {
            const theta = (i / 24) * Math.PI * 2;
            const pts: THREE.Vector3[] = [];
            for (let j = 0; j <= 64; j++) {
                const phi = (j / 64) * Math.PI;
                pts.push(new THREE.Vector3(
                    3000 * Math.sin(phi) * Math.cos(theta),
                    3000 * Math.cos(phi),
                    3000 * Math.sin(phi) * Math.sin(theta)
                ));
            }
            const g = new THREE.BufferGeometry().setFromPoints(pts);
            disposables.push(g);
            gridGroup.add(new THREE.Line(g, gridMat));
        }
        // Lignes de RA (parallèles de déclinaison)
        for (let dec = -75; dec <= 75; dec += 15) {
            const pts: THREE.Vector3[] = [];
            const phi = THREE.MathUtils.degToRad(90 - dec);
            for (let j = 0; j <= 64; j++) {
                const theta = (j / 64) * Math.PI * 2;
                pts.push(new THREE.Vector3(
                    3000 * Math.sin(phi) * Math.cos(theta),
                    3000 * Math.cos(phi),
                    3000 * Math.sin(phi) * Math.sin(theta)
                ));
            }
            const g = new THREE.BufferGeometry().setFromPoints(pts);
            disposables.push(g);
            gridGroup.add(new THREE.Line(g, gridMat));
        }
        scene.add(gridGroup);
        gridGroupRef.current = gridGroup;

        // ── 3. Voie Lactée ──────────────────────────────────────────────────
        const MW_COUNT = 5000;
        const mwPos = new Float32Array(MW_COUNT * 3);
        const mwColors = new Float32Array(MW_COUNT * 3);
        for (let i = 0; i < MW_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spread = (Math.random() - 0.5) * 600;
            const r = 3500;
            mwPos[i * 3]     = r * Math.cos(angle) + spread * 0.3;
            mwPos[i * 3 + 1] = (Math.random() - 0.5) * 700;
            mwPos[i * 3 + 2] = r * Math.sin(angle) + spread * 0.3;
            // Dégradé bleu-violet
            mwColors[i * 3]     = 0.2 + Math.random() * 0.2;
            mwColors[i * 3 + 1] = 0.3 + Math.random() * 0.3;
            mwColors[i * 3 + 2] = 0.7 + Math.random() * 0.3;
        }
        const mwGeo = new THREE.BufferGeometry();
        mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPos, 3));
        mwGeo.setAttribute('color', new THREE.BufferAttribute(mwColors, 3));
        disposables.push(mwGeo);
        const mwMat = new THREE.PointsMaterial({
            size: 60, vertexColors: true, transparent: true,
            opacity: 0.18, blending: THREE.AdditiveBlending, sizeAttenuation: true,
        });
        disposableMats.push(mwMat);
        const mwPoints = new THREE.Points(mwGeo, mwMat);
        mwPoints.rotation.x = Math.PI * 0.12;
        scene.add(mwPoints);
        mwPointsRef.current = mwPoints;

        // ── 4. Étoiles navigables ───────────────────────────────────────────
        const posMap = new Map<string, THREE.Vector3>();
        const entries: StarEntry[] = [];
        STARS.forEach(star => {
            const pos = toSphere(star.position.x, star.position.y);
            posMap.set(star.id, pos);

            const group = new THREE.Group();
            group.position.copy(pos);
            group.userData = { body: star };

            const isMajor = star.type === 'SYSTEM' || ['sirius', 'polaris', 'betelgeuse', 'rigel', 'aldebaran', 'regulus'].includes(star.id);
            const size = isMajor ? 18 : 10;

            // Sphère étoile
            const geo = new THREE.SphereGeometry(size, 16, 16);
            disposables.push(geo);
            const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(star.colors[0]) });
            disposableMats.push(mat);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.userData = { body: star };
            group.add(mesh);

            // Lueur
            const glowGeo = new THREE.SphereGeometry(size * 3.5, 12, 12);
            disposables.push(glowGeo);
            const glowMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(star.colors[0]),
                transparent: true, opacity: 0.15,
                blending: THREE.AdditiveBlending,
            });
            disposableMats.push(glowMat);
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.userData = { body: star };
            group.add(glow);

            // Cible de clic et survol invisible (hitbox généreuse 250 units)
            const hitGeo = new THREE.SphereGeometry(250, 8, 8);
            disposables.push(hitGeo);
            const hitMat = new THREE.MeshBasicMaterial({ visible: false });
            disposableMats.push(hitMat);
            const hitMesh = new THREE.Mesh(hitGeo, hitMat);
            hitMesh.userData = { body: star };
            group.add(hitMesh);

            // Label canvas
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 80;
            const ctx = canvas.getContext('2d')!;
            ctx.font = '500 28px Inter, system-ui';
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.textAlign = 'left';
            ctx.fillText(star.name, 8, 50);
            const tex = new THREE.CanvasTexture(canvas);
            const labelMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0 });
            disposableMats.push(labelMat);
            const label = new THREE.Sprite(labelMat);
            label.scale.set(140, 22, 1);
            label.position.set(size + 20, -8, 0);
            group.add(label);

            scene.add(group);
            entries.push({ group, body: star, glow, label });
        });
        starPosMapRef.current = posMap;
        starEntriesRef.current = entries;

        // ── 5. Constellations ───────────────────────────────────────────────
        const constGroup = new THREE.Group();
        const constLines: { mesh: THREE.LineSegments; id: string }[] = [];

        CONSTELLATIONS.forEach(c => {
            const linePositions: number[] = [];
            c.connections.forEach(([idA, idB]) => {
                const posA = posMap.get(idA);
                const posB = posMap.get(idB);
                if (posA && posB) {
                    linePositions.push(posA.x, posA.y, posA.z, posB.x, posB.y, posB.z);
                }
            });
            if (linePositions.length === 0) return;

            const lineGeo = new THREE.BufferGeometry();
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            disposables.push(lineGeo);
            const lineMat = new THREE.LineBasicMaterial({
                color: 0x4deeea, transparent: true, opacity: 0.28,
                blending: THREE.AdditiveBlending,
            });
            disposableMats.push(lineMat);
            const lines = new THREE.LineSegments(lineGeo, lineMat);
            lines.userData = { constellation: c };
            constGroup.add(lines);
            constLines.push({ mesh: lines, id: c.id });

            // Label de la constellation
            const firstId = c.connections[0]?.[0];
            const labelPos = firstId ? posMap.get(firstId) : null;
            if (labelPos) {
                const canvas = document.createElement('canvas');
                canvas.width = 512; canvas.height = 128;
                const ctx = canvas.getContext('2d')!;
                ctx.font = '700 40px Inter, system-ui';
                ctx.fillStyle = 'rgba(77, 238, 234, 0.75)';
                ctx.textAlign = 'center';
                ctx.letterSpacing = '4px';
                ctx.fillText(c.name.toUpperCase(), 256, 72);
                const tex = new THREE.CanvasTexture(canvas);
                const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.6 });
                disposableMats.push(spriteMat);
                const sprite = new THREE.Sprite(spriteMat);
                sprite.scale.set(350, 88, 1);
                sprite.position.copy(labelPos).multiplyScalar(1.12);
                constGroup.add(sprite);
            }
        });

        scene.add(constGroup);
        constGroupRef.current = constGroup;
        constLinesRef.current = constLines;

        // ── 6. Ligne laser de mesure ────────────────────────────────────────
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

        // ── Cleanup : dispose de toutes les ressources GPU ──────────────────
        return () => {
            disposables.forEach(g => g.dispose());
            disposableMats.forEach(m => m.dispose());
            scene.clear();
            starEntriesRef.current = [];
            constLinesRef.current = [];
            constGroupRef.current = null;
            gridGroupRef.current = null;
            mwPointsRef.current = null;
            laserRef.current = null;
            starPosMapRef.current.clear();
        };
    }, [isReady, scene, camera, toSphere]);

    // ── OrbitControls (mode libre) ────────────────────────────────────────────
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
        controls.minDistance = 200;
        controls.maxDistance = 5000;
        controlsRef.current = controls;
        return () => {
            controls.dispose();
            controlsRef.current = null;
        };
    }, [perspectiveMode, camera, renderer]);

    // ── Boucle d'animation ────────────────────────────────────────────────────
    useEffect(() => {
        if (!isReady) return;
        const entries = starEntriesRef.current;
        const constLines = constLinesRef.current;
        let hoveredStarId: string | null = null;
        let hoveredConstId: string | null = null;
        const raycaster = new THREE.Raycaster();
        raycaster.params.Line = { threshold: 25 };
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
                const targetZ = 1500 / Math.max(0.05, effectiveZoom);
                cam.position.z = THREE.MathUtils.lerp(cam.position.z, targetZ, 0.05);
            } else {
                controlsRef.current?.update();
                scene.rotation.x = THREE.MathUtils.lerp(scene.rotation.x, 0, 0.05);
                scene.rotation.y = THREE.MathUtils.lerp(scene.rotation.y, 0, 0.05);
            }

            // Rotation très lente du starfield
            const bgPoints = scene.children.find(c => c instanceof THREE.Points && c !== mwPointsRef.current);
            if (bgPoints) bgPoints.rotation.y += 0.00003;

            // Layers
            if (gridGroupRef.current) gridGroupRef.current.visible = showGrid;
            if (mwPointsRef.current) {
                mwPointsRef.current.visible = showMilkyWay;
                if (showMilkyWay) mwPointsRef.current.rotation.y += 0.00008;
            }
            if (constGroupRef.current) constGroupRef.current.visible = showConstellations;

            // Animation étoiles (hover)
            entries.forEach(e => {
                const isHov = hoveredStarId === e.body.id;
                const targetScale = isHov ? 2.5 : 1.0;
                e.group.scale.setScalar(THREE.MathUtils.lerp(e.group.scale.x, targetScale, 0.12));
                const glowMat = e.glow.material as THREE.MeshBasicMaterial;
                glowMat.opacity = THREE.MathUtils.lerp(glowMat.opacity, isHov ? 0.9 : 0.15, 0.1);
                const labelMat = e.label.material as THREE.SpriteMaterial;
                labelMat.opacity = THREE.MathUtils.lerp(labelMat.opacity, isHov ? 1.0 : 0, 0.1);
            });

            // Animation lignes constellations (hover)
            constLines.forEach(l => {
                const isHov = hoveredConstId === l.id;
                const mat = l.mesh.material as THREE.LineBasicMaterial;
                mat.opacity = THREE.MathUtils.lerp(mat.opacity, isHov ? 0.9 : 0.28, 0.08);
            });

            // Laser de mesure
            const laser = laserRef.current;
            if (laser) {
                if (isMeasuringMode && distancePoints.length === 2) {
                    const posA = starPosMapRef.current.get(distancePoints[0].id);
                    const posB = starPosMapRef.current.get(distancePoints[1].id);
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

            // Scintillement cosmique subtil
            void time;
        });

        // ── Interactions souris ─────────────────────────────────────────────
        const handleMove = (e: MouseEvent) => {
            const rend = renderer.current;
            const cam = camera.current;
            if (!rend || !cam) return;

            // Ne pas intercepter si la souris survole une UI interactif
            const targetEl = e.target as HTMLElement | null;
            if (targetEl?.closest('button, input, a, aside, nav, .pointer-events-auto')) {
                if (hoveredStarId !== null) {
                    hoveredStarId = null;
                    onHover(null);
                }
                return;
            }

            const rect = rend.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, cam);

            // Test étoiles
            const starGroups = entries.map(e => e.group);
            const hits = raycaster.intersectObjects(starGroups, true);
            const starHit = hits.find(h => h.object.userData.body);
            const starBody = starHit ? (starHit.object.userData.body as CelestialBody) : null;
            if (hoveredStarId !== (starBody?.id ?? null)) {
                hoveredStarId = starBody?.id ?? null;
                onHover(starBody);
            }

            // Test constellations
            if (!starBody && showConstellations && constGroupRef.current) {
                const constHits = raycaster.intersectObjects(constGroupRef.current.children, true);
                const constHit = constHits.find(h => h.object.userData.constellation);
                const constData = constHit ? constHit.object.userData.constellation : null;
                if (hoveredConstId !== (constData?.id ?? null)) {
                    hoveredConstId = constData?.id ?? null;
                    setHoveredConst(constData ?? null);
                }
            } else if (hoveredConstId) {
                hoveredConstId = null;
                setHoveredConst(null);
            }

            if (rend) {
                rend.domElement.style.cursor = (starBody || hoveredConstId) ? 'pointer' : 'default';
            }
        };

        const handleClick = (e: MouseEvent) => {
            const rend = renderer.current;
            const cam = camera.current;
            if (!rend || !cam) return;

            const targetEl = e.target as HTMLElement | null;
            if (targetEl?.closest('button, input, a, aside, nav, .pointer-events-auto')) {
                return;
            }

            const rect = rend.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, cam);

            const hits = raycaster.intersectObjects(starEntriesRef.current.map(e => e.group), true);
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
        orientation, zoom, showGrid, showMilkyWay, showConstellations,
        perspectiveMode, isMeasuringMode, distancePoints, addDistancePoint,
        camera, renderer,
    ]);

    // ── Contrôle drag pour orientation héliocentrique ─────────────────────────
    useEffect(() => {
        const el = renderer.current?.domElement;
        if (!el || perspectiveMode === 'free') return;
        let dragging = false;
        let last = { x: 0, y: 0 };
        const onDown = (e: MouseEvent) => { dragging = true; last = { x: e.clientX, y: e.clientY }; };
        const onMove = (e: MouseEvent) => {
            if (!dragging) return;
            const dx = e.clientX - last.x;
            const dy = e.clientY - last.y;
            let rot = orientation.rotation + dx * 0.5;
            if (rot > 180) rot -= 360;
            if (rot < -180) rot += 360;
            const inc = Math.max(0, Math.min(90, orientation.inclination - dy * 0.3));
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

    // ── Rendu UI overlay ──────────────────────────────────────────────────────
    return (
        <div className="absolute inset-0 pointer-events-none select-none">
            {/* En-tête viewport */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 bg-black/80 backdrop-blur-2xl px-10 py-4 rounded-full border border-white/10 shadow-2xl">
                <span className="font-mono text-[8px] uppercase text-white/40 tracking-[0.4em] font-black">Deep Sky Navigator</span>
                <span className="font-mono text-[12px] text-[var(--accent-primary)] font-black tracking-[0.2em] uppercase">
                    Galactic Sector :: MILKY_WAY
                </span>
            </div>

            {/* Brackets HUD */}
            <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-[var(--accent-primary)]/30 rounded-tl-2xl" />
            <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-[var(--accent-primary)]/30 rounded-tr-2xl" />
            <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-[var(--accent-primary)]/30 rounded-bl-2xl" />
            <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-[var(--accent-primary)]/30 rounded-br-2xl" />

            {/* Toggle constellations */}
            <div className="absolute top-24 left-6 pointer-events-auto">
                <button
                    onClick={() => setShowConstellations(!showConstellations)}
                    className={`flex items-center gap-3 px-5 py-2.5 rounded-full border transition-all backdrop-blur-3xl text-[9px] font-black uppercase tracking-[0.2em] ${showConstellations
                        ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                        : 'bg-black/60 border-white/10 text-white/40 hover:text-white'
                        }`}
                >
                    <Waypoints size={14} />
                    {showConstellations ? 'Projection: Active' : 'Projection: Offline'}
                </button>
            </div>

            {/* Info constellation au survol */}
            <AnimatePresence>
                {hoveredConst && (
                    <motion.div
                        key={hoveredConst.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="absolute top-40 left-6 monolith-panel p-6 w-[300px] border-[var(--accent-primary)]/20 pointer-events-none z-40"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <Sparkles size={12} className="text-[var(--accent-primary)]" />
                            <span className="font-mono text-[8px] uppercase text-[var(--accent-primary)] font-black tracking-[0.4em]">Pattern Lock</span>
                        </div>
                        <h4 className="text-xl font-black uppercase text-white tracking-tight mb-2">{hoveredConst.name}</h4>
                        <p className="text-xs text-[#6c6c7a] leading-relaxed mb-4">{hoveredConst.description}</p>
                        {hoveredConst.astronomicalContext && (
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Info size={10} className="text-[var(--accent-primary)]" />
                                    <span className="font-mono text-[7px] uppercase text-white/40 font-black">Contexte Scientifique</span>
                                </div>
                                <p className="text-[10px] text-white/60 leading-relaxed">{hoveredConst.astronomicalContext}</p>
                            </div>
                        )}
                        {hoveredConst.area && (
                            <div className="flex gap-4 mt-3 pt-3 border-t border-white/5">
                                <div>
                                    <span className="text-[7px] text-[#6c6c7a] uppercase font-black block">Superficie</span>
                                    <span className="text-white text-[9px] font-bold">{hoveredConst.area}</span>
                                </div>
                                {hoveredConst.bestObservation && (
                                    <div>
                                        <span className="text-[7px] text-[#6c6c7a] uppercase font-black block">Observation</span>
                                        <span className="text-white text-[9px] font-bold">{hoveredConst.bestObservation}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.8)] pointer-events-none" />
        </div>
    );
};
