"use client";

/**
 * @file components/view/CelestialBody3D.tsx
 * @description Hologramme 3D Three.js pour visualisation détaillée d'un astre — Orbital Monolith v3.7.
 *
 * Optimisations :
 * - Performance : RAF loop fluide sans démontage intempestif du renderer lors du survol (utilisation de refs).
 * - Tactile : Support unifié des PointerEvents avec touch-action: none.
 * - Responsive : Taille adaptative fluide avec contrainte max-width pour mobile.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CelestialBody } from '@/types';

interface CelestialBody3DProps {
    body: CelestialBody;
    size?: number;
    showTitle?: boolean;
    onClick?: () => void;
}

export const CelestialBody3D: React.FC<CelestialBody3DProps> = ({
    body,
    size = 280,
    showTitle = true,
    onClick
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const isHoveredRef = useRef(false);
    const onClickRef = useRef(onClick);
    onClickRef.current = onClick;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Vider le conteneur pour éviter toute duplication de canvas WebGL
        container.innerHTML = '';

        const width = size;
        const height = size;

        // Scene
        const scene = new THREE.Scene();

        // Camera
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        camera.position.z = 3.5;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.domElement.style.touchAction = 'none';
        renderer.domElement.style.maxWidth = '100%';
        renderer.domElement.style.height = 'auto';
        container.appendChild(renderer.domElement);

        // --- Main Sphere geometry ---
        const geometry = new THREE.SphereGeometry(1, 64, 64);

        // --- Sphere Material ---
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(body.colors[0]),
            emissive: new THREE.Color(body.colors[1]),
            emissiveIntensity: body.type === 'STAR' ? 0.7 : 0.15,
            roughness: body.type === 'STAR' ? 0.0 : 0.7,
            metalness: body.type === 'STAR' ? 0.0 : 0.4,
        });

        const sphere = new THREE.Mesh(geometry, material);
        sphere.userData = { interactive: true };
        scene.add(sphere);

        // --- Atmospheric/Glow Effect (Custom Fresnel Shader) ---
        const glowGeometry = new THREE.SphereGeometry(1.15, 64, 64);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                viewVector: { value: camera.position },
                glowColor: { value: new THREE.Color(body.colors[0]) },
                hoverIntensity: { value: 0.0 },
                time: { value: 0.0 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vViewPosition = -mvPosition.xyz;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                uniform vec3 glowColor;
                uniform float hoverIntensity;
                uniform float time;
                void main() {
                    float pulse = 0.96 + 0.04 * sin(time * 0.8);
                    float intensity = pow(0.6 * pulse - dot(vNormal, normalize(vViewPosition)), 4.0);
                    gl_FragColor = vec4(glowColor, intensity + (hoverIntensity * 0.15));
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
        });

        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        scene.add(glowMesh);

        // --- Lighting ---
        const ambientLight = new THREE.AmbientLight(body.colors[0], body.type === 'STAR' ? 1.8 : 0.5);
        scene.add(ambientLight);

        const primaryLight = new THREE.PointLight(0xffffff, 1.5, 10);
        primaryLight.position.set(5, 5, 5);
        scene.add(primaryLight);

        const secondaryLight = new THREE.PointLight(body.colors[1], 1, 10);
        secondaryLight.position.set(-5, -2, 2);
        scene.add(secondaryLight);

        // Interaction unifiée (Mouse & Touch via PointerEvents)
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onPointerMove = (event: PointerEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(sphere);
            const hovering = intersects.length > 0;
            if (isHoveredRef.current !== hovering) {
                isHoveredRef.current = hovering;
                setIsHovered(hovering);
            }
            renderer.domElement.style.cursor = hovering ? 'pointer' : 'default';
        };

        const onPointerLeave = () => {
            if (isHoveredRef.current) {
                isHoveredRef.current = false;
                setIsHovered(false);
                renderer.domElement.style.cursor = 'default';
            }
        };

        const onPointerDown = (event: PointerEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(sphere);
            if (intersects.length > 0 && onClickRef.current) {
                onClickRef.current();
            }
        };

        const dom = renderer.domElement;
        dom.addEventListener('pointermove', onPointerMove);
        dom.addEventListener('pointerleave', onPointerLeave);
        dom.addEventListener('pointerdown', onPointerDown);

        // Boucle d'animation (exécutée en continu sans remontage)
        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            sphere.rotation.y += 0.0015;

            const elapsed = Date.now() * 0.001;
            glowMaterial.uniforms.time.value = elapsed;

            const hovered = isHoveredRef.current;
            const pulseBase = body.type === 'STAR' ? 1.02 : 0.98;
            const pulseAmp = hovered ? 0.04 : 0.015;
            const pulse = pulseBase + Math.sin(elapsed * 0.8) * pulseAmp;

            glowMesh.scale.set(pulse, pulse, pulse);

            glowMaterial.uniforms.hoverIntensity.value = THREE.MathUtils.lerp(
                glowMaterial.uniforms.hoverIntensity.value,
                hovered ? 1.0 : 0.0,
                0.05
            );

            const targetEmissive = (body.type === 'STAR' ? 0.7 : 0.15) + (hovered ? 0.3 : 0);
            material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, targetEmissive, 0.05);

            renderer.render(scene, camera);
        };
        animate();

        // Cleanup complet et propre
        return () => {
            cancelAnimationFrame(animationFrameId);
            dom.removeEventListener('pointermove', onPointerMove);
            dom.removeEventListener('pointerleave', onPointerLeave);
            dom.removeEventListener('pointerdown', onPointerDown);
            renderer.dispose();
            geometry.dispose();
            material.dispose();
            glowGeometry.dispose();
            glowMaterial.dispose();
            if (container) {
                container.innerHTML = '';
            }
        };
    }, [body, size]);

    return (
        <div
            className={`flex flex-col items-center justify-center relative transition-transform duration-300 max-w-full select-none ${isHovered ? 'scale-105' : 'scale-100'}`}
            style={{
                background: `radial-gradient(circle at center, ${body.colors[0]}${isHovered ? '35' : '15'} 0%, transparent 70%)`
            }}
        >
            <div
                ref={containerRef}
                style={{ width: `${size}px`, height: `${size}px`, maxWidth: '100%' }}
                className="relative z-10 flex items-center justify-center overflow-hidden aspect-square"
            >
                <div
                    className={`absolute inset-0 rounded-full blur-[60px] sm:blur-[80px] transition-opacity duration-700 pointer-events-none ${isHovered ? 'opacity-30' : 'opacity-[0.12]'}`}
                    style={{ backgroundColor: body.colors[0] }}
                />
            </div>

            {showTitle && (
                <div className="mt-2 sm:mt-3 text-center z-10 px-2 max-w-full">
                    <h2
                        className={`text-lg sm:text-xl font-black uppercase tracking-tight mb-0.5 transition-all duration-300 truncate ${isHovered ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' : ''}`}
                        style={{ color: body.colors[0] }}
                    >
                        {body.name}
                    </h2>
                    <div className="font-mono text-[7px] sm:text-[8px] text-white/40 uppercase tracking-[0.25em] sm:tracking-[0.4em] truncate">
                        IDENT: {body.scientificName} // {body.type}
                    </div>
                </div>
            )}
        </div>
    );
};
