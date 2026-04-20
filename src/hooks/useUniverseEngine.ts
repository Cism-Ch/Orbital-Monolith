"use client";

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

interface UniverseEngineOptions {
    cameraFov?: number;
    cameraNear?: number;
    cameraFar?: number;
    alpha?: boolean;
}

export function useUniverseEngine(options: UniverseEngineOptions = {}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const onAnimateRef = useRef<((time: number, scene: THREE.Scene, camera: THREE.PerspectiveCamera) => void)[]>([]);

    const registerAnimation = useCallback((fn: (time: number, scene: THREE.Scene, camera: THREE.PerspectiveCamera) => void) => {
        onAnimateRef.current.push(fn);
        return () => {
            onAnimateRef.current = onAnimateRef.current.filter(f => f !== fn);
        };
    }, []);

    // Effect for core initialization
    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize Renderer if not exists
        if (!rendererRef.current) {
            const renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: options.alpha ?? true,
                powerPreference: "high-performance",
            });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            rendererRef.current = renderer;
            containerRef.current.appendChild(renderer.domElement);
        }

        // Initialize Camera if not exists
        if (!cameraRef.current) {
            const camera = new THREE.PerspectiveCamera(
                options.cameraFov || 45,
                containerRef.current.clientWidth / containerRef.current.clientHeight,
                options.cameraNear || 0.1,
                options.cameraFar || 20000
            );
            // SkyMapView uses FOV 60 and lerps toward targetCamZ = 1500 / zoom;
            // SolarSystemView uses the default FOV 45 and lerps toward 1200 / zoom.
            // Setting the initial z to the zoom=1 target ensures the scene is
            // visible immediately rather than fading in from z=0.
            const isWideFov = (options.cameraFov ?? 45) >= 60;
            camera.position.z = isWideFov ? 1500 : 1200;
            cameraRef.current = camera;
        }

        // Resize handling with ResizeObserver for better stability
        const resizeObserver = new ResizeObserver((entries) => {
            if (!entries[0] || !rendererRef.current || !cameraRef.current) return;
            const { width, height } = entries[0].contentRect;

            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(width, height, false);
        });

        resizeObserver.observe(containerRef.current);

        // Animation Loop
        const animate = () => {
            animationFrameIdRef.current = requestAnimationFrame(animate);
            const time = Date.now() * 0.001;

            if (rendererRef.current && sceneRef.current && cameraRef.current) {
                onAnimateRef.current.forEach(fn => fn(time, sceneRef.current, cameraRef.current!));
                rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
        };

        if (!animationFrameIdRef.current) {
            animate();
        }

        return () => {
            resizeObserver.disconnect();
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
            // Dispose all scene objects (geometries, materials, textures) on unmount.
            // Checking for geometry/material presence covers Mesh, Points, and Line objects
            // without needing verbose type assertions for each subclass.
            sceneRef.current.traverse((obj) => {
                const renderable = obj as THREE.Mesh;
                if (renderable.geometry) renderable.geometry.dispose();
                if (renderable.material) {
                    if (Array.isArray(renderable.material)) {
                        renderable.material.forEach((m: THREE.Material) => m.dispose());
                    } else {
                        (renderable.material as THREE.Material).dispose();
                    }
                }
            });
            sceneRef.current.clear();
            if (rendererRef.current) {
                rendererRef.current.dispose();
                rendererRef.current.domElement.remove();
                rendererRef.current = null;
            }
        };
    }, []); // Only run once on mount

    // Handle option updates without re-initializing
    useEffect(() => {
        if (cameraRef.current) {
            cameraRef.current.fov = options.cameraFov || 45;
            cameraRef.current.near = options.cameraNear || 0.1;
            cameraRef.current.far = options.cameraFar || 20000;
            cameraRef.current.updateProjectionMatrix();
        }
    }, [options.cameraFov, options.cameraNear, options.cameraFar]);

    return {
        containerRef,
        scene: sceneRef.current,
        camera: cameraRef,
        renderer: rendererRef,
        registerAnimation
    };
}
