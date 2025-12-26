
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { STARS, CONSTELLATIONS } from '../constants';
import { CelestialBody } from '../types';
import { Plus, Minus, RotateCw, Waypoints, Target, Info, Sparkles } from 'lucide-react';

interface SkyMapViewProps {
    onSelect: (body: CelestialBody) => void;
    onHover: (body: CelestialBody | null) => void;
    orientation: { rotation: number; inclination: number };
    setOrientation: (o: { rotation: number; inclination: number }) => void;
}

export const SkyMapView: React.FC<SkyMapViewProps> = ({ onSelect, onHover, orientation, setOrientation }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [showConstellations, setShowConstellations] = useState(true);
    
    const [constInfo, setConstInfo] = useState<any | null>(null);

    const onHoverRef = useRef(onHover);
    const onSelectRef = useRef(onSelect);
    const orientationRef = useRef(orientation);
    const zoomRef = useRef(zoom);
    const hoveredStarIdRef = useRef<string | null>(null);
    const hoveredConstIdRef = useRef<string | null>(null);

    useEffect(() => { onHoverRef.current = onHover; }, [onHover]);
    useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
    useEffect(() => { orientationRef.current = orientation; }, [orientation]);
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);

    const sceneObjectsRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        starGroups: { group: THREE.Group; body: CelestialBody; glow: THREE.Mesh }[];
        constellationLines: { mesh: THREE.LineSegments; data: any }[];
        constellationGroup: THREE.Group;
    } | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, width / height, 1, 10000);
        camera.position.z = 1000;

        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        const starCount = 10000;
        const starPositions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            starPositions[i * 3] = (Math.random() - 0.5) * 8000;
            starPositions[i * 3 + 1] = (Math.random() - 0.5) * 8000;
            starPositions[i * 3 + 2] = (Math.random() - 0.5) * 8000;
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.35 });
        const starPoints = new THREE.Points(starGeo, starMat);
        scene.add(starPoints);

        const starPositionsMap = new Map<string, THREE.Vector3>();
        const starGroups: any[] = [];

        STARS.forEach(star => {
            const group = new THREE.Group();
            const pos = new THREE.Vector3(star.position.x, star.position.y, 0);
            starPositionsMap.set(star.id, pos);
            
            const isSystem = star.type === 'SYSTEM';
            const size = isSystem ? 12 : 6;
            
            const pGeo = new THREE.SphereGeometry(size, isSystem ? 32 : 16, isSystem ? 32 : 16);
            const pMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(star.colors[0]) });
            const pMesh = new THREE.Mesh(pGeo, pMat);
            pMesh.userData = { body: star };
            group.add(pMesh);

            const glowGeo = new THREE.SphereGeometry(size * 2.5, 32, 32);
            const glowMat = new THREE.MeshBasicMaterial({ 
                color: new THREE.Color(star.colors[0]), 
                transparent: true, 
                opacity: 0.1,
                blending: THREE.AdditiveBlending 
            });
            const glowMesh = new THREE.Mesh(glowGeo, glowMat);
            group.add(glowMesh);

            group.position.copy(pos);
            scene.add(group);
            starGroups.push({ group, body: star, glow: glowMesh });
        });

        const constellationLines: any[] = [];
        const constellationGroup = new THREE.Group();
        CONSTELLATIONS.forEach(c => {
            const linePositions: number[] = [];
            c.connections.forEach(([idA, idB]) => {
                const posA = starPositionsMap.get(idA);
                const posB = starPositionsMap.get(idB);
                if (posA && posB) {
                    linePositions.push(posA.x, posA.y, posA.z, posB.x, posB.y, posB.z);
                }
            });
            const lineGeo = new THREE.BufferGeometry();
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            const lineMat = new THREE.LineBasicMaterial({ 
                color: 0x4deeea, 
                transparent: true, 
                opacity: 0.2, 
                blending: THREE.AdditiveBlending 
            });
            const lines = new THREE.LineSegments(lineGeo, lineMat);
            lines.userData = { constellation: c };
            constellationGroup.add(lines);
            constellationLines.push({ mesh: lines, data: c });
        });
        scene.add(constellationGroup);

        sceneObjectsRef.current = { scene, camera, renderer, starGroups, constellationLines, constellationGroup };

        const raycaster = new THREE.Raycaster();
        raycaster.params.Line.threshold = 20;
        const mouse = new THREE.Vector2();

        const onMouseMoveLocal = (event: MouseEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            
            const starIntersects = raycaster.intersectObjects(starGroups.map(s => s.group), true);
            const starHit = starIntersects.find(i => i.object.userData.body);
            const starBody = starHit ? starHit.object.userData.body as CelestialBody : null;
            
            if (hoveredStarIdRef.current !== (starBody?.id || null)) {
                hoveredStarIdRef.current = starBody?.id || null;
                onHoverRef.current(starBody);
            }

            if (!starHit && showConstellations) {
                const constIntersects = raycaster.intersectObjects(constellationGroup.children, true);
                const constHit = constIntersects.find(i => i.object.userData.constellation);
                const hitData = constHit ? constHit.object.userData.constellation : null;
                
                if (hoveredConstIdRef.current !== (hitData?.id || null)) {
                    hoveredConstIdRef.current = hitData?.id || null;
                    setConstInfo(hitData);
                }
            } else {
                hoveredConstIdRef.current = null;
                setConstInfo(null);
            }
            
            renderer.domElement.style.cursor = (starHit || (showConstellations && hoveredConstIdRef.current)) ? 'pointer' : 'default';
        };

        const onClick = () => {
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);
            const starHit = intersects.find(i => i.object.userData.body);
            if (starHit) onSelectRef.current(starHit.object.userData.body);
        };

        const onResize = () => {
            if (!containerRef.current) return;
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };

        renderer.domElement.addEventListener('click', onClick);
        renderer.domElement.addEventListener('mousemove', onMouseMoveLocal);
        window.addEventListener('resize', onResize);

        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const time = Date.now() * 0.001;
            
            starPoints.rotation.y += 0.00008;

            if (sceneObjectsRef.current) {
                const { scene, camera, starGroups, constellationLines } = sceneObjectsRef.current;
                
                const targetRotX = THREE.MathUtils.degToRad(orientationRef.current.inclination);
                const targetRotY = THREE.MathUtils.degToRad(orientationRef.current.rotation);
                const targetCamZ = 1200 / zoomRef.current;

                scene.rotation.x = THREE.MathUtils.lerp(scene.rotation.x, targetRotX, 0.1);
                scene.rotation.y = THREE.MathUtils.lerp(scene.rotation.y, targetRotY, 0.1);
                camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.1);

                starGroups.forEach(s => {
                    const isHovered = hoveredStarIdRef.current === s.body.id;
                    const targetScale = isHovered ? 1.8 + Math.sin(time * 0.8) * 0.1 : 1.0;
                    
                    s.group.scale.set(
                        THREE.MathUtils.lerp(s.group.scale.x, targetScale, 0.2),
                        THREE.MathUtils.lerp(s.group.scale.y, targetScale, 0.2),
                        THREE.MathUtils.lerp(s.group.scale.z, targetScale, 0.2)
                    );

                    const mat = s.glow.material as THREE.MeshBasicMaterial;
                    const targetOpacity = isHovered ? 0.7 + Math.sin(time * 0.8) * 0.1 : 0.15;
                    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.2);
                });

                constellationLines.forEach(l => {
                    const isHovered = hoveredConstIdRef.current === l.data.id;
                    const mat = l.mesh.material as THREE.LineBasicMaterial;
                    const targetOpacity = isHovered ? 1.0 : 0.25;
                    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1);
                });
            }

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            renderer.domElement.removeEventListener('click', onClick);
            renderer.domElement.removeEventListener('mousemove', onMouseMoveLocal);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
            if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
        };
    }, []);

    useEffect(() => {
        if (!sceneObjectsRef.current) return;
        sceneObjectsRef.current.constellationGroup.visible = showConstellations;
    }, [showConstellations]);

    return (
        <div className="w-full h-full relative overflow-hidden bg-black/50 select-none">
            <div ref={containerRef} className="w-full h-full cursor-move" />
            
            {constInfo && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 monolith-panel !rounded-xl p-4 w-[280px] bg-black/95 backdrop-blur-3xl border border-[var(--accent-primary)]/40 z-[60] pointer-events-none animate-in fade-in zoom-in-95 duration-500 shadow-2xl">
                    <div className="flex items-center gap-1.5 mb-2 border-b border-white/10 pb-1.5">
                        <Sparkles size={12} className="text-[var(--accent-primary)] animate-pulse" />
                        <span className="font-mono text-[7px] uppercase text-[var(--accent-primary)] tracking-[0.4em] font-black">Archive Lock</span>
                    </div>
                    <h4 className="text-xl font-black uppercase text-white tracking-tighter mb-1.5">{constInfo.name}</h4>
                    <p className="text-[9px] text-white/80 leading-relaxed mb-3 font-light opacity-90 italic">
                        "{constInfo.description}"
                    </p>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center gap-1 mb-1">
                            <Info size={8} className="text-[#6c6c7a]" />
                            <span className="font-mono text-[6px] uppercase text-[#6c6c7a] tracking-widest font-black">Data Fragment</span>
                        </div>
                        <p className="text-[8px] text-white/50 leading-relaxed font-mono">
                            {constInfo.astronomicalContext}
                        </p>
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-20">
                <div className="monolith-panel !p-2.5 flex flex-col gap-2 bg-black/80 backdrop-blur-3xl border border-white/5 shadow-2xl">
                   <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between font-mono text-[6px] uppercase text-white/30">
                                <span>Lat.</span>
                                <span>{orientation.inclination}°</span>
                            </div>
                            <input type="range" min="-90" max="90" value={orientation.inclination} onChange={(e) => setOrientation({...orientation, inclination: parseInt(e.target.value)})} className="w-24 h-0.5 bg-white/5 rounded-full appearance-none cursor-pointer hover:bg-white/10 transition-colors" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between font-mono text-[6px] uppercase text-white/30">
                                <span>Long.</span>
                                <span>{orientation.rotation}°</span>
                            </div>
                            <input type="range" min="-180" max="180" value={orientation.rotation} onChange={(e) => setOrientation({...orientation, rotation: parseInt(e.target.value)})} className="w-24 h-0.5 bg-white/5 rounded-full appearance-none cursor-pointer hover:bg-white/10 transition-colors" />
                        </div>
                   </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                    <button onClick={() => setShowConstellations(!showConstellations)} className={`p-1.5 glass-button transition-all ${showConstellations ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/20' : 'text-white/40'}`}><Waypoints size={12} /></button>
                    <button onClick={() => setZoom(z => Math.min(z + 0.3, 8))} className="p-1.5 glass-button shadow-xl"><Plus size={12} /></button>
                    <button onClick={() => setZoom(z => Math.max(z - 0.3, 0.3))} className="p-1.5 glass-button shadow-xl"><Minus size={12} /></button>
                    <button onClick={() => { setOrientation({rotation: 0, inclination: 0}); setZoom(1); }} className="p-1.5 glass-button shadow-xl text-[var(--accent-primary)]"><RotateCw size={12} /></button>
                </div>
            </div>
        </div>
    );
};
