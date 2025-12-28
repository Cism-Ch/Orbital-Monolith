"use client";

import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { STARS, CONSTELLATIONS } from '@/constants';
import { CelestialBody } from '@/types';
import { useUniverseEngine } from '@/hooks/useUniverseEngine';
import { UniverseContainer } from './UniverseContainer';
import { Sparkles, Info, Waypoints } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SkyMapViewProps {
    onSelect: (body: CelestialBody) => void;
    onHover: (body: CelestialBody | null) => void;
    orientation: { rotation: number; inclination: number };
    setOrientation: (o: { rotation: number; inclination: number }) => void;
    // New Props
    showGrid: boolean;
    setShowGrid: (v: boolean) => void;
    showMilkyWay: boolean;
    setShowMilkyWay: (v: boolean) => void;
}

export const SkyMapView: React.FC<SkyMapViewProps> = ({
    onSelect,
    onHover,
    orientation,
    setOrientation,
    showGrid,
    setShowGrid,
    showMilkyWay,
    setShowMilkyWay
}) => {
    const [zoom, setZoom] = useState(1);
    const [showConstellations, setShowConstellations] = useState(true);
    const [constInfo, setConstInfo] = useState<any | null>(null);
    const { containerRef, scene, registerAnimation, renderer, camera } = useUniverseEngine({ cameraFov: 60 });

    const skyObjects = useMemo(() => {
        scene.clear();

        // 1. Static Starfield (Distant Background)
        const starCount = 15000;
        const starPositions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = 2 * Math.PI * Math.random();
            const r = 8000;
            starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            starPositions[i * 3 + 2] = r * Math.cos(phi);
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        const starPoints = new THREE.Points(starGeo, new THREE.PointsMaterial({
            color: 0xffffff, size: 0.7, transparent: true, opacity: 0.3, sizeAttenuation: false
        }));
        scene.add(starPoints);

        // 2. Celestial Grid (RA/Dec)
        const gridGroup = new THREE.Group();
        const gridMaterial = new THREE.LineBasicMaterial({ color: 0x4deeea, transparent: true, opacity: 0.1 });

        // Meridian lines
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            const pts = [];
            for (let j = 0; j <= 64; j++) {
                const phi = (j / 64) * Math.PI;
                pts.push(new THREE.Vector3(3000 * Math.sin(phi) * Math.cos(angle), 3000 * Math.cos(phi), 3000 * Math.sin(phi) * Math.sin(angle)));
            }
            gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMaterial));
        }
        // Parallel lines
        for (let i = -8; i <= 8; i++) {
            const phi = ((i + 9) / 18) * Math.PI;
            const pts = [];
            for (let j = 0; j <= 64; j++) {
                const theta = (j / 64) * Math.PI * 2;
                pts.push(new THREE.Vector3(3000 * Math.sin(phi) * Math.cos(theta), 3000 * Math.cos(phi), 3000 * Math.sin(phi) * Math.sin(theta)));
            }
            gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMaterial));
        }
        scene.add(gridGroup);

        // 3. Milky Way Haze
        const mwCount = 4000;
        const mwPositions = new Float32Array(mwCount * 3);
        const mwColors = new Float32Array(mwCount * 3);
        for (let i = 0; i < mwCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = (Math.random() - 0.5) * 400;
            const r = 3500;
            const x = r * Math.cos(angle) + dist;
            const y = (Math.random() - 0.5) * 600;
            const z = r * Math.sin(angle) + dist;
            mwPositions[i * 3] = x; mwPositions[i * 3 + 1] = y; mwPositions[i * 3 + 2] = z;
            mwColors[i * 3] = 0.3; mwColors[i * 3 + 1] = 0.5; mwColors[i * 3 + 2] = 0.8;
        }
        const mwGeo = new THREE.BufferGeometry();
        mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPositions, 3));
        mwGeo.setAttribute('color', new THREE.BufferAttribute(mwColors, 3));
        const mwPoints = new THREE.Points(mwGeo, new THREE.PointsMaterial({
            size: 40, vertexColors: true, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, sizeAttenuation: true
        }));
        mwPoints.rotation.x = Math.PI * 0.15;
        scene.add(mwPoints);

        // 4. Cardinal Points
        const cardinals = [
            { label: 'N', pos: [0, 0, -3200] }, { label: 'S', pos: [0, 0, 3200] },
            { label: 'E', pos: [3200, 0, 0] }, { label: 'W', pos: [-3200, 0, 0] }
        ];
        cardinals.forEach(c => {
            const canvas = document.createElement('canvas');
            canvas.width = 128; canvas.height = 128;
            const ctx = canvas.getContext('2d')!;
            ctx.font = 'bold 80px Courier New';
            ctx.fillStyle = '#4deeea';
            ctx.textAlign = 'center';
            ctx.fillText(c.label, 64, 80);
            const tex = new THREE.CanvasTexture(canvas);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.6 }));
            sprite.scale.set(100, 100, 1);
            sprite.position.set(c.pos[0], c.pos[1], c.pos[2]);
            scene.add(sprite);
        });

        // 5. Major Stars & Labels
        const starPositionsMap = new Map<string, THREE.Vector3>();
        const starGroups: { group: THREE.Group; body: CelestialBody; glow: THREE.Mesh, label: THREE.Sprite }[] = [];

        STARS.forEach(star => {
            const group = new THREE.Group();
            // Scale and spread stars on a sphere
            const r = 2500;
            const phi = (90 - star.position.y) * (Math.PI / 180);
            const theta = (star.position.x) * (Math.PI / 180);
            const pos = new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
            starPositionsMap.set(star.id, pos);

            const size = star.type === 'SYSTEM' ? 15 : 8;
            const starMesh = new THREE.Mesh(
                new THREE.SphereGeometry(size, 16, 16),
                new THREE.MeshBasicMaterial({ color: new THREE.Color(star.colors[0]) })
            );
            starMesh.userData = { body: star };
            group.add(starMesh);

            const glow = new THREE.Mesh(
                new THREE.SphereGeometry(size * 3, 16, 16),
                new THREE.MeshBasicMaterial({ color: new THREE.Color(star.colors[0]), transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending })
            );
            group.add(glow);

            // Premium Label (Contextual)
            const canvas = document.createElement('canvas');
            canvas.width = 256; canvas.height = 64;
            const ctx = canvas.getContext('2d')!;
            ctx.font = '24px Inter';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'left';
            ctx.shadowBlur = 4; ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.fillText(star.name.toLowerCase(), 10, 40);
            const labelTex = new THREE.CanvasTexture(canvas);
            const labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex, transparent: true, opacity: 0 }));
            labelSprite.scale.set(120, 30, 1);
            labelSprite.position.set(20, -10, 0);
            group.add(labelSprite);

            group.position.copy(pos);
            scene.add(group);
            starGroups.push({ group, body: star, glow, label: labelSprite });
        });

        // 6. Constellation Lines & Labels
        const constellationLines: { mesh: THREE.LineSegments; data: any }[] = [];
        const constellationLabels: THREE.Sprite[] = [];
        const constellationGroup = new THREE.Group();
        CONSTELLATIONS.forEach(c => {
            const linePositions: number[] = [];
            c.connections.forEach(([idA, idB]) => {
                const posA = starPositionsMap.get(idA);
                const posB = starPositionsMap.get(idB);
                if (posA && posB) linePositions.push(posA.x, posA.y, posA.z, posB.x, posB.y, posB.z);
            });
            const lineGeo = new THREE.BufferGeometry();
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
                color: 0x4deeea, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending
            }));
            lines.userData = { constellation: c };
            constellationGroup.add(lines);
            constellationLines.push({ mesh: lines, data: c });

            // Constellation Label (MAJUSCULES)
            if (c.connections.length > 0) {
                const posA = starPositionsMap.get(c.connections[0][0])!;
                const canvas = document.createElement('canvas');
                canvas.width = 512; canvas.height = 128;
                const ctx = canvas.getContext('2d')!;
                ctx.font = '900 48px Inter';
                ctx.fillStyle = 'rgba(77, 238, 234, 0.8)'; // Increased opacity from 0.6 to 0.8
                ctx.textAlign = 'center';
                ctx.letterSpacing = '10px';
                ctx.fillText(c.name.toUpperCase(), 256, 64);
                const tex = new THREE.CanvasTexture(canvas);
                const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.6 })); // Increased from 0.4 to 0.6
                sprite.scale.set(400, 100, 1);
                sprite.position.copy(posA).multiplyScalar(1.1);
                constellationGroup.add(sprite);
                constellationLabels.push(sprite);
            }
        });
        scene.add(constellationGroup);

        return { starPoints, starGroups, constellationLines, constellationGroup, gridGroup, mwPoints };
    }, [scene]);

    useEffect(() => {
        let hoveredStarId: string | null = null;
        let hoveredConstId: string | null = null;
        const raycaster = new THREE.Raycaster();
        raycaster.params.Line.threshold = 30;
        const mouse = new THREE.Vector2();

        const cleanup = registerAnimation((time, scene, camera) => {
            const targetRotX = THREE.MathUtils.degToRad(orientation.inclination);
            const targetRotY = THREE.MathUtils.degToRad(orientation.rotation);
            const targetCamZ = 1500 / zoom;

            scene.rotation.x = THREE.MathUtils.lerp(scene.rotation.x, targetRotX, 0.05);
            scene.rotation.y = THREE.MathUtils.lerp(scene.rotation.y, targetRotY, 0.05);
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.05);

            skyObjects.starPoints.rotation.y += 0.00005;
            skyObjects.mwPoints.visible = showMilkyWay;
            skyObjects.gridGroup.visible = showGrid;

            if (showMilkyWay) {
                skyObjects.mwPoints.rotation.y += 0.0001;
            }

            // Animate stars
            skyObjects.starGroups.forEach(s => {
                const isHovered = hoveredStarId === s.body.id;
                const scale = THREE.MathUtils.lerp(s.group.scale.x, isHovered ? 2.5 : 1.0, 0.1);
                s.group.scale.setScalar(scale);

                (s.glow.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(
                    (s.glow.material as THREE.MeshBasicMaterial).opacity,
                    isHovered ? 0.8 : 0.2, 0.1
                );

                // Show label only on hover
                (s.label.material as THREE.SpriteMaterial).opacity = THREE.MathUtils.lerp(
                    (s.label.material as THREE.SpriteMaterial).opacity,
                    isHovered ? 1.0 : 0, 0.1
                );
            });

            // Animate Constellations
            skyObjects.constellationGroup.visible = showConstellations;
            skyObjects.constellationLines.forEach(l => {
                const isHovered = hoveredConstId === l.data.id;
                const targetOpacity = isHovered ? 1.0 : 0.3;
                (l.mesh.material as THREE.LineBasicMaterial).opacity = THREE.MathUtils.lerp(
                    (l.mesh.material as THREE.LineBasicMaterial).opacity,
                    targetOpacity, 0.1
                );
            });
        });

        const handleMouseMove = (e: MouseEvent) => {
            if (!renderer.current || !camera.current) return;
            const rect = renderer.current.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera.current);

            // Star Detection
            const starIntersects = raycaster.intersectObjects(skyObjects.starGroups.map(s => s.group), true);
            const starHit = starIntersects.find(i => (i.object.userData as any).body);
            const starBody = starHit ? (starHit.object.userData as any).body as CelestialBody : null;

            if (hoveredStarId !== (starBody?.id || null)) {
                hoveredStarId = starBody?.id || null;
                onHover(starBody);
            }

            // Constellation Detection (if no star hit)
            if (!starHit && showConstellations) {
                const constIntersects = raycaster.intersectObjects(skyObjects.constellationGroup.children);
                const constHit = constIntersects.find(i => (i.object.userData as any).constellation);
                const hitData = constHit ? (constHit.object.userData as any).constellation : null;

                if (hoveredConstId !== (hitData?.id || null)) {
                    hoveredConstId = hitData?.id || null;
                    setConstInfo(hitData);
                }
            } else {
                hoveredConstId = null;
                setConstInfo(null);
            }

            renderer.current.domElement.style.cursor = (starHit || (showConstellations && hoveredConstId)) ? 'pointer' : 'default';
        };

        const handleClick = () => {
            if (!renderer.current || !camera.current) return;
            raycaster.setFromCamera(mouse, camera.current);
            const intersects = raycaster.intersectObjects(scene.children, true);
            const starHit = intersects.find(i => (i.object as any).userData.body);
            if (starHit) onSelect((starHit.object as any).userData.body);
        };

        const el = renderer.current?.domElement;
        if (el) {
            el.addEventListener('mousemove', handleMouseMove);
            el.addEventListener('click', handleClick);
        }

        return () => {
            cleanup();
            if (el) {
                el.removeEventListener('mousemove', handleMouseMove);
                el.removeEventListener('click', handleClick);
            }
        };
    }, [registerAnimation, skyObjects, zoom, orientation, onHover, onSelect, renderer, camera, scene, showConstellations, showGrid, showMilkyWay]);

    return (
        <UniverseContainer
            containerRef={containerRef}
            orientation={orientation}
            setOrientation={setOrientation}
            zoom={zoom}
            setZoom={setZoom}
            title="Deep Sky Navigator"
            subtitle="Galactic Sector::MILKY_WAY"
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            showMilkyWay={showMilkyWay}
            setShowMilkyWay={setShowMilkyWay}
        >
            {/* Constellation Toggle - Specific to SkyMap */}
            <div className="absolute top-24 left-8 z-30">
                <button
                    onClick={() => setShowConstellations(!showConstellations)}
                    className={`flex items-center gap-3 px-5 py-2.5 rounded-full border transition-all backdrop-blur-3xl text-[9px] font-black uppercase tracking-[0.2em] ${showConstellations
                        ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.2)]'
                        : 'bg-black/60 border-white/10 text-white/40 hover:text-white'
                        }`}
                >
                    <Waypoints size={14} />
                    {showConstellations ? 'Projection: Active' : 'Projection: Offline'}
                </button>
            </div>

            {/* Floating Constellation Intel Card */}
            <AnimatePresence>
                {constInfo && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="absolute top-40 left-8 monolith-panel !rounded-[2rem] p-6 w-[320px] !bg-black/90 pointer-events-none z-40 border-[var(--accent-primary)]/30"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <Sparkles size={14} className="text-[var(--accent-primary)]" />
                            <span className="font-mono text-[8px] uppercase text-[var(--accent-primary)] font-black tracking-[0.4em]">Pattern Lock</span>
                        </div>
                        <h4 className="text-2xl font-black uppercase text-white tracking-tighter mb-2">{constInfo.name}</h4>
                        <p className="text-xs text-[#6c6c7a] leading-relaxed mb-4 italic">
                            {constInfo.description}
                        </p>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                            <div className="flex items-center gap-2">
                                <Info size={10} className="text-[var(--accent-primary)]" />
                                <span className="font-mono text-[8px] uppercase text-white/40 font-black">Gaia_Intel // Myth & Science</span>
                            </div>
                            <p className="text-[10px] text-white/60 leading-relaxed">
                                {constInfo.astronomicalContext || "Part of the 88 official celestial zones. Records indicate significant cultural influence from ancient navigators and Arabic astronomers (e.g. naming conventions like Al-Tair)."}
                            </p>
                            {constInfo.id === 'cassiopeia' && (
                                <div className="pt-2 border-t border-white/5 flex flex-col gap-1">
                                    <span className="text-[7px] font-black uppercase text-[var(--accent-primary)]">Royal Family Saga</span>
                                    <span className="text-[9px] text-[#6c6c7a]">Legendary Queen of Ethiopia, wife of Cepheus. Recognizable by its distinct 'W' shape.</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </UniverseContainer>
    );
};
