
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CelestialBody } from '../types';

interface CelestialBody3DProps {
    body: CelestialBody;
    size?: number;
    onClick?: () => void;
}

export const CelestialBody3D: React.FC<CelestialBody3DProps> = ({ body, size = 300, onClick }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const width = size;
        const height = size;

        // Scene
        const scene = new THREE.Scene();

        // Camera
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        camera.position.z = 3.5;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(renderer.domElement);

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

        // Interaction
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onMouseMove = (event: MouseEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(sphere);
            const hovering = intersects.length > 0;
            setIsHovered(hovering);
            renderer.domElement.style.cursor = hovering ? 'pointer' : 'default';
        };

        const onLocalClick = (event: MouseEvent) => {
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(sphere);
            if (intersects.length > 0 && onClick) {
                onClick();
            }
        };

        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('click', onLocalClick);

        // Animation
        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            
            sphere.rotation.y += 0.0015;
            
            const elapsed = Date.now() * 0.001;
            glowMaterial.uniforms.time.value = elapsed;

            const pulseBase = body.type === 'STAR' ? 1.02 : 0.98;
            const pulseAmp = isHovered ? 0.04 : 0.015;
            const pulse = pulseBase + Math.sin(elapsed * 0.8) * pulseAmp;
            
            glowMesh.scale.set(pulse, pulse, pulse);
            
            glowMaterial.uniforms.hoverIntensity.value = THREE.MathUtils.lerp(
                glowMaterial.uniforms.hoverIntensity.value,
                isHovered ? 1.0 : 0.0,
                0.03
            );

            const targetEmissive = (body.type === 'STAR' ? 0.7 : 0.15) + (isHovered ? 0.3 : 0);
            material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, targetEmissive, 0.03);

            renderer.render(scene, camera);
        };
        animate();

        // Cleanup
        return () => {
            cancelAnimationFrame(animationFrameId);
            renderer.domElement.removeEventListener('mousemove', onMouseMove);
            renderer.domElement.removeEventListener('click', onLocalClick);
            renderer.dispose();
            geometry.dispose();
            material.dispose();
            glowGeometry.dispose();
            glowMaterial.dispose();
            if (containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
            }
        };
    }, [body, size, isHovered, onClick]);

    return (
        <div 
            className={`flex flex-col items-center justify-center animate-in zoom-in-75 duration-1000 relative overflow-visible rounded-full transition-all duration-1000 ${isHovered ? 'scale-105' : 'scale-100'}`}
            style={{ 
                background: `radial-gradient(circle at center, ${body.colors[0]}${isHovered ? '35' : '15'} 0%, transparent 70%)` 
            }}
        >
            <div 
                ref={containerRef}
                style={{ width: `${size}px`, height: `${size}px` }}
                className="relative z-10"
            >
                <div 
                    className={`absolute inset-0 rounded-full blur-[100px] transition-opacity duration-2000 pointer-events-none ${isHovered ? 'opacity-30' : 'opacity-[0.12]'}`}
                    style={{ backgroundColor: body.colors[0] }}
                />
            </div>

            <div className="mt-4 text-center z-10">
                <h2 className={`text-xl font-black uppercase tracking-tighter mb-0.5 transition-all duration-1000 ${isHovered ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' : ''}`} style={{ color: body.colors[0] }}>
                    {body.name}
                </h2>
                <div className="font-mono text-[7px] text-white/30 uppercase tracking-[0.4em]">
                    IDENT: {body.scientificName} // {body.type}
                </div>
            </div>
        </div>
    );
};
