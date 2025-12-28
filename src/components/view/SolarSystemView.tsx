"use client";

import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { SOLAR_SYSTEM } from '@/constants';
import { CelestialBody } from '@/types';
import { useUniverseEngine } from '@/hooks/useUniverseEngine';
import { UniverseContainer } from './UniverseContainer';

interface SolarSystemViewProps {
    onSelect: (body: CelestialBody) => void;
    onHover: (body: CelestialBody | null) => void;
    orientation: { rotation: number; inclination: number };
    setOrientation: (o: { rotation: number; inclination: number }) => void;
    // New Props for Layer Controls
    showGrid: boolean;
    setShowGrid: (v: boolean) => void;
    showMilkyWay: boolean;
    setShowMilkyWay: (v: boolean) => void;
}

export const SolarSystemView: React.FC<SolarSystemViewProps> = ({
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
    const { containerRef, scene, registerAnimation, renderer, camera } = useUniverseEngine();

    // Memoize planet objects to avoid re-creation
    const systemObjects = useMemo(() => {
        const planets: {
            mesh: THREE.Mesh;
            glow: THREE.Mesh;
            orbitRing: THREE.Mesh;
            body: CelestialBody;
            orbit: number;
            speed: number;
            angle: number;
        }[] = [];

        // Clear scene if needed (though scene is persistent in hook ref)
        scene.clear();

        // 1. Distant Starfield for System View
        const starCount = 8000;
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = 2 * Math.PI * Math.random();
            const r = 9000;
            starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            starPos[i * 3 + 2] = r * Math.cos(phi);
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starPoints = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0.2, sizeAttenuation: false }));
        scene.add(starPoints);

        // 2. Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const sunLight = new THREE.PointLight(0xffdd00, 8, 5000);
        scene.add(sunLight);

        // 3. Celestial Grid Structure (for System)
        const gridGroup = new THREE.Group();
        const gridMat = new THREE.LineBasicMaterial({ color: 0x4deeea, transparent: true, opacity: 0.05 });
        const ringGeo = new THREE.RingGeometry(180, 1500, 64);
        const gridMain = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x4deeea, transparent: true, opacity: 0.02, side: THREE.DoubleSide }));
        gridMain.rotation.x = Math.PI / 2;
        gridGroup.add(gridMain);
        scene.add(gridGroup);

        // 4. Milky Way Backdrop (System version)
        const mwCount = 2000;
        const mwPos = new Float32Array(mwCount * 3);
        for (let i = 0; i < mwCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const r = 4000 + Math.random() * 500;
            mwPos[i * 3] = r * Math.cos(theta);
            mwPos[i * 3 + 1] = (Math.random() - 0.5) * 400;
            mwPos[i * 3 + 2] = r * Math.sin(theta);
        }
        const mwGeo = new THREE.BufferGeometry();
        mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPos, 3));
        const mwPoints = new THREE.Points(mwGeo, new THREE.PointsMaterial({ size: 100, color: 0x4d88ff, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending }));
        scene.add(mwPoints);

        // 5. Sun
        const sunGeo = new THREE.SphereGeometry(35, 64, 64);
        const sunMat = new THREE.MeshStandardMaterial({
            color: 0xffdd00,
            emissive: 0xffaa00,
            emissiveIntensity: 2.0,
        });
        const sunMesh = new THREE.Mesh(sunGeo, sunMat);
        sunMesh.userData = { body: SOLAR_SYSTEM[0] };
        scene.add(sunMesh);

        const sunGlow = new THREE.Mesh(
            new THREE.SphereGeometry(45, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending })
        );
        scene.add(sunGlow);

        // 6. Belts
        const createBelt = (radiusMin: number, radiusMax: number, count: number, color: number) => {
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = radiusMin + Math.random() * (radiusMax - radiusMin);
                const y = (Math.random() - 0.5) * 8;
                pos[i * 3] = Math.cos(angle) * r;
                pos[i * 3 + 1] = y;
                pos[i * 3 + 2] = Math.sin(angle) * r;
            }
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            const mat = new THREE.PointsMaterial({ color, size: 1.0, transparent: true, opacity: 0.4 });
            const points = new THREE.Points(geo, mat);
            scene.add(points);
            return points;
        };
        createBelt(360, 440, 2500, 0x888888);
        createBelt(900, 1200, 4000, 0x4488ff);

        // 7. Planets
        SOLAR_SYSTEM.slice(1).forEach((planet, idx) => {
            let orbitRadius;
            if (idx < 4) orbitRadius = (idx + 1) * 70 + 60;
            else if (planet.id === 'ceres') orbitRadius = 400;
            else orbitRadius = (idx - 4) * 120 + 550;

            const orbitGeo = new THREE.RingGeometry(orbitRadius - 0.7, orbitRadius + 0.7, 128);
            const orbitRing = new THREE.Mesh(orbitGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide })); // Increased from 0.1 to 0.15
            orbitRing.rotation.x = Math.PI / 2;
            scene.add(orbitRing);

            const size = 12 + idx * 2.0; // Increased from 11 + idx * 1.5
            const pMesh = new THREE.Mesh(
                new THREE.SphereGeometry(size, 32, 32),
                new THREE.MeshStandardMaterial({
                    color: new THREE.Color(planet.colors[0]),
                    emissive: new THREE.Color(planet.colors[0]),
                    emissiveIntensity: 1.2 // Increased from 0.8 for better visibility
                })
            );
            pMesh.userData = { body: planet };
            scene.add(pMesh);

            const pGlow = new THREE.Mesh(
                new THREE.SphereGeometry(size * 1.7, 16, 16),
                new THREE.MeshBasicMaterial({ color: new THREE.Color(planet.colors[0]), transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending }) // Increased from 0.05
            );
            scene.add(pGlow);

            planets.push({ mesh: pMesh, glow: pGlow, orbitRing: orbitRing, body: planet, orbit: orbitRadius, speed: 0.003 / (orbitRadius * 0.01), angle: Math.random() * Math.PI * 2 });
        });

        return { planets, sun: { mesh: sunMesh, glow: sunGlow }, gridGroup, mwPoints, starPoints };
    }, [scene]);

    // Animation & Interaction Logic
    useEffect(() => {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let hoveredId: string | null = null;

        const cleanup = registerAnimation((time, scene, camera) => {
            const targetRotX = THREE.MathUtils.degToRad(orientation.inclination);
            const targetRotY = THREE.MathUtils.degToRad(orientation.rotation);
            const targetCamZ = 1200 / zoom;

            scene.rotation.x = THREE.MathUtils.lerp(scene.rotation.x, targetRotX, 0.05);
            scene.rotation.y = THREE.MathUtils.lerp(scene.rotation.y, targetRotY, 0.05);
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.05);

            // Layer visibility
            systemObjects.gridGroup.visible = showGrid;
            systemObjects.mwPoints.visible = showMilkyWay;

            // Animate Sun
            const sunIsHovered = hoveredId === SOLAR_SYSTEM[0].id;
            systemObjects.sun.mesh.scale.setScalar(THREE.MathUtils.lerp(systemObjects.sun.mesh.scale.x, sunIsHovered ? 1.2 : 1.0, 0.1));
            systemObjects.sun.glow.scale.copy(systemObjects.sun.mesh.scale);
            systemObjects.sun.mesh.rotation.y += 0.005;

            // Animate Planets
            systemObjects.planets.forEach(p => {
                p.angle += p.speed;
                const x = Math.cos(p.angle) * p.orbit;
                const z = Math.sin(p.angle) * p.orbit;
                p.mesh.position.set(x, 0, z);
                p.glow.position.set(x, 0, z);
                p.mesh.rotation.y += 0.01;

                const isHovered = hoveredId === p.body.id;
                const targetScale = isHovered ? 1.5 : 1.0;
                p.mesh.scale.setScalar(THREE.MathUtils.lerp(p.mesh.scale.x, targetScale, 0.15));
                p.glow.scale.copy(p.mesh.scale);

                (p.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = THREE.MathUtils.lerp((p.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity, isHovered ? 2.5 : 0.8, 0.1);
                (p.glow.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp((p.glow.material as THREE.MeshBasicMaterial).opacity, isHovered ? 0.6 : 0.05, 0.1);
                (p.orbitRing.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp((p.orbitRing.material as THREE.MeshBasicMaterial).opacity, isHovered ? 0.5 : 0.1, 0.1);
            });
        });

        const handleMouseMove = (e: MouseEvent) => {
            if (!renderer.current || !camera.current) return;
            const rect = renderer.current.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera.current);
            const intersects = raycaster.intersectObjects(scene.children);
            const hit = intersects.find(i => (i.object.userData as any).body);
            const target = hit ? (hit.object.userData as any).body as CelestialBody : null;

            if (hoveredId !== (target?.id || null)) {
                hoveredId = target?.id || null;
                onHover(target);
                renderer.current.domElement.style.cursor = target ? 'pointer' : 'default';
            }
        };

        const handleClick = () => {
            if (!renderer.current || !camera.current) return;
            raycaster.setFromCamera(mouse, camera.current);
            const intersects = raycaster.intersectObjects(scene.children);
            const hit = intersects.find(i => (i.object.userData as any).body);
            if (hit) onSelect((hit.object.userData as any).body);
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
    }, [registerAnimation, systemObjects, zoom, orientation, onHover, onSelect, renderer, camera, scene, showGrid, showMilkyWay]);

    return (
        <UniverseContainer
            containerRef={containerRef}
            orientation={orientation}
            setOrientation={setOrientation}
            zoom={zoom}
            setZoom={setZoom}
            title="Solar System Visualization"
            subtitle={`Sector::${SOLAR_SYSTEM[0].name.toUpperCase()}`}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            showMilkyWay={showMilkyWay}
            setShowMilkyWay={setShowMilkyWay}
        >
        </UniverseContainer>
    );
};
