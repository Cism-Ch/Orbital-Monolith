
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SOLAR_SYSTEM } from '../constants';
import { CelestialBody } from '../types';
import { Plus, Minus, RotateCw, Settings, Layers } from 'lucide-react';

interface SolarSystemViewProps {
    onSelect: (body: CelestialBody) => void;
    onHover: (body: CelestialBody | null) => void;
    orientation: { rotation: number; inclination: number };
    setOrientation: (o: { rotation: number; inclination: number }) => void;
}

export const SolarSystemView: React.FC<SolarSystemViewProps> = ({ 
    onSelect, 
    onHover, 
    orientation, 
    setOrientation 
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    
    const onHoverRef = useRef(onHover);
    const onSelectRef = useRef(onSelect);
    const orientationRef = useRef(orientation);
    const zoomRef = useRef(zoom);
    const hoveredIdRef = useRef<string | null>(null);

    useEffect(() => { onHoverRef.current = onHover; }, [onHover]);
    useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
    useEffect(() => { orientationRef.current = orientation; }, [orientation]);
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);

    const sceneObjectsRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        sun: { mesh: THREE.Mesh; glow: THREE.Mesh };
        planets: { 
            mesh: THREE.Mesh; 
            glow: THREE.Mesh; 
            orbitRing: THREE.Mesh; 
            body: CelestialBody; 
            orbit: number; 
            speed: number; 
            angle: number;
            emissiveValue: number;
        }[];
        belts: THREE.Points[];
    } | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 8000);
        camera.position.set(0, 0, 1000);

        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true, 
            powerPreference: "high-performance",
            preserveDrawingBuffer: true
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const sunLight = new THREE.PointLight(0xffdd00, 4, 4000);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);

        // Sun
        const sunGeo = new THREE.SphereGeometry(35, 64, 64);
        const sunMat = new THREE.MeshStandardMaterial({
            color: 0xffdd00,
            emissive: 0xffaa00,
            emissiveIntensity: 1.5,
        });
        const sunMesh = new THREE.Mesh(sunGeo, sunMat);
        sunMesh.userData = { body: SOLAR_SYSTEM[0] };
        scene.add(sunMesh);

        const sunGlowGeo = new THREE.SphereGeometry(45, 32, 32);
        const sunGlowMat = new THREE.MeshBasicMaterial({ 
            color: 0xffaa00, 
            transparent: true, 
            opacity: 0.25,
            blending: THREE.AdditiveBlending 
        });
        const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
        scene.add(sunGlow);

        const createBelt = (radiusMin: number, radiusMax: number, count: number, color: number) => {
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(count * 3);
            for(let i=0; i<count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = radiusMin + Math.random() * (radiusMax - radiusMin);
                const y = (Math.random() - 0.5) * 10;
                pos[i*3] = Math.cos(angle) * r;
                pos[i*3+1] = y;
                pos[i*3+2] = Math.sin(angle) * r;
            }
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            const mat = new THREE.PointsMaterial({ color, size: 0.8, transparent: true, opacity: 0.4 });
            return new THREE.Points(geo, mat);
        };

        const asteroidBelt = createBelt(360, 440, 2000, 0x888888);
        scene.add(asteroidBelt);

        const kuiperBelt = createBelt(900, 1200, 3000, 0x4488ff);
        scene.add(kuiperBelt);

        const planetData: any[] = [];
        SOLAR_SYSTEM.slice(1).forEach((planet, idx) => {
            let orbitRadius;
            if (idx < 4) { 
                orbitRadius = (idx + 1) * 70 + 60;
            } else if (planet.id === 'ceres') {
                orbitRadius = 400; 
            } else { 
                orbitRadius = (idx - 4) * 120 + 550;
            }
            
            const orbitGeo = new THREE.RingGeometry(orbitRadius - 0.5, orbitRadius + 0.5, 160);
            const orbitMat = new THREE.MeshBasicMaterial({ 
                color: 0xffffff, 
                transparent: true, 
                opacity: 0.08, 
                side: THREE.DoubleSide 
            });
            const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
            orbitRing.rotation.x = Math.PI / 2;
            scene.add(orbitRing);

            const size = 11 + idx * 1.5;
            const pGeo = new THREE.SphereGeometry(size, 48, 48);
            const pMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(planet.colors[0]),
                emissive: new THREE.Color(planet.colors[1]),
                emissiveIntensity: 0.3,
                roughness: 0.5,
                metalness: 0.5
            });
            const pMesh = new THREE.Mesh(pGeo, pMat);
            pMesh.userData = { body: planet };
            scene.add(pMesh);

            const pGlowGeo = new THREE.SphereGeometry(size * 1.7, 32, 32);
            const pGlowMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(planet.colors[0]),
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending
            });
            const pGlow = new THREE.Mesh(pGlowGeo, pGlowMat);
            scene.add(pGlow);

            planetData.push({
                mesh: pMesh,
                glow: pGlow,
                orbitRing: orbitRing,
                body: planet,
                orbit: orbitRadius,
                speed: 0.003 / (orbitRadius * 0.01),
                angle: Math.random() * Math.PI * 2,
                emissiveValue: 0.3
            });
        });

        sceneObjectsRef.current = { 
            scene, camera, renderer, 
            sun: { mesh: sunMesh, glow: sunGlow }, 
            planets: planetData,
            belts: [asteroidBelt, kuiperBelt]
        };

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onMouseMove = (event: MouseEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children);
            const bodyPart = intersects.find(i => i.object.userData.body);
            const target = bodyPart ? bodyPart.object.userData.body as CelestialBody : null;
            
            if (hoveredIdRef.current !== (target?.id || null)) {
                hoveredIdRef.current = target?.id || null;
                onHoverRef.current(target);
                renderer.domElement.style.cursor = target ? 'pointer' : 'default';
            }
        };

        const onClick = () => {
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children);
            const bodyPart = intersects.find(i => i.object.userData.body);
            if (bodyPart) onSelectRef.current(bodyPart.object.userData.body);
        };

        const onResize = () => {
            if (!containerRef.current) return;
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };

        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('click', onClick);
        window.addEventListener('resize', onResize);

        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const time = Date.now() * 0.001;

            if (sceneObjectsRef.current) {
                const { scene, camera, sun, planets, belts } = sceneObjectsRef.current;
                const hoveredId = hoveredIdRef.current;

                const targetRotX = THREE.MathUtils.degToRad(orientationRef.current.inclination);
                const targetRotY = THREE.MathUtils.degToRad(orientationRef.current.rotation);
                const targetCamZ = (1000 / zoomRef.current);

                scene.rotation.x = THREE.MathUtils.lerp(scene.rotation.x, targetRotX, 0.1);
                scene.rotation.y = THREE.MathUtils.lerp(scene.rotation.y, targetRotY, 0.1);
                camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.08);

                belts.forEach((belt, i) => {
                    belt.rotation.y += (i === 0 ? 0.0005 : 0.0002);
                });

                planets.forEach(p => {
                    p.angle += p.speed;
                    const posX = Math.cos(p.angle) * p.orbit;
                    const posZ = Math.sin(p.angle) * p.orbit;
                    
                    p.mesh.position.set(posX, 0, posZ);
                    p.glow.position.set(posX, 0, posZ);
                    p.mesh.rotation.y += 0.015;

                    const isHovered = hoveredId === p.body.id;
                    const targetScale = isHovered ? 1.35 + Math.sin(time * 0.8) * 0.05 : 1.0;
                    
                    p.mesh.scale.set(
                        THREE.MathUtils.lerp(p.mesh.scale.x, targetScale, 0.2),
                        THREE.MathUtils.lerp(p.mesh.scale.y, targetScale, 0.2),
                        THREE.MathUtils.lerp(p.mesh.scale.z, targetScale, 0.2)
                    );
                    p.glow.scale.copy(p.mesh.scale);

                    const mat = p.mesh.material as THREE.MeshStandardMaterial;
                    const glowMat = p.glow.material as THREE.MeshBasicMaterial;
                    const orbitMat = p.orbitRing.material as THREE.MeshBasicMaterial;

                    p.emissiveValue = THREE.MathUtils.lerp(p.emissiveValue, isHovered ? 3.0 : 0.3, 0.2);
                    mat.emissiveIntensity = p.emissiveValue;
                    glowMat.opacity = THREE.MathUtils.lerp(glowMat.opacity, isHovered ? 0.6 + Math.sin(time * 0.8) * 0.1 : 0, 0.2);
                    orbitMat.opacity = THREE.MathUtils.lerp(orbitMat.opacity, isHovered ? 0.4 : 0.08, 0.15);
                });

                const sunIsHovered = hoveredId === SOLAR_SYSTEM[0].id;
                const sunTargetScale = sunIsHovered ? 1.2 + Math.sin(time * 0.8) * 0.03 : 1.0;
                sun.mesh.scale.set(
                    THREE.MathUtils.lerp(sun.mesh.scale.x, sunTargetScale, 0.15),
                    THREE.MathUtils.lerp(sun.mesh.scale.y, sunTargetScale, 0.15),
                    THREE.MathUtils.lerp(sun.mesh.scale.z, sunTargetScale, 0.15)
                );
                sun.glow.scale.copy(sun.mesh.scale);
                sun.mesh.rotation.y += 0.005;
                
                const sunGlowMat = sun.glow.material as THREE.MeshBasicMaterial;
                sunGlowMat.opacity = THREE.MathUtils.lerp(sunGlowMat.opacity, sunIsHovered ? 0.6 : 0.25, 0.2);
            }

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            renderer.domElement.removeEventListener('mousemove', onMouseMove);
            renderer.domElement.removeEventListener('click', onClick);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
            if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
        };
    }, []); 

    return (
        <div className="relative w-full h-full flex items-center justify-center select-none">
            <div ref={containerRef} className="w-full h-full" />
            
            <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-20">
                <div className="monolith-panel !p-2.5 flex flex-col gap-2 bg-black/80 backdrop-blur-3xl border border-white/5 shadow-2xl">
                   <div className="flex items-center gap-1.5 mb-0.5">
                       <Layers size={10} className="text-white/20" />
                       <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-[#6c6c7a] font-bold">Planes</span>
                   </div>
                   <div className="flex flex-col gap-1.5">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between font-mono text-[6px] uppercase text-white/30">
                                <span>Radial Inc.</span>
                                <span>{orientation.inclination}°</span>
                            </div>
                            <input type="range" min="0" max="85" value={orientation.inclination} onChange={(e) => setOrientation({...orientation, inclination: parseInt(e.target.value)})} className="w-24 h-0.5 bg-white/5 rounded-full appearance-none cursor-pointer hover:bg-white/10 transition-colors" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between font-mono text-[6px] uppercase text-white/30">
                                <span>Rot. Angle</span>
                                <span>{orientation.rotation}°</span>
                            </div>
                            <input type="range" min="-180" max="180" value={orientation.rotation} onChange={(e) => setOrientation({...orientation, rotation: parseInt(e.target.value)})} className="w-24 h-0.5 bg-white/5 rounded-full appearance-none cursor-pointer hover:bg-white/10 transition-colors" />
                        </div>
                   </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                    <button onClick={() => setZoom(z => Math.min(z + 0.3, 6))} className="p-1.5 glass-button shadow-xl"><Plus size={12} /></button>
                    <button onClick={() => setZoom(z => Math.max(z - 0.3, 0.1))} className="p-1.5 glass-button shadow-xl"><Minus size={12} /></button>
                    <button onClick={() => { setOrientation({rotation: 0, inclination: 60}); setZoom(1); }} className="p-1.5 glass-button shadow-xl text-[var(--accent-primary)]"><RotateCw size={12} /></button>
                </div>
            </div>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-2xl p-1.5 px-4 rounded-xl border border-white/5 pointer-events-none shadow-xl">
                <div className="flex flex-col items-center">
                    <span className="font-mono text-[6px] uppercase text-white/30 mb-0.5 tracking-widest font-black">Celestial Viewport</span>
                    <span className="font-mono text-[8px] text-[var(--accent-primary)] font-black tracking-[0.2em]">
                        SOLAR_RADIUS::{orientation.rotation}° ROT // {orientation.inclination}° INC
                    </span>
                </div>
            </div>
        </div>
    );
};
