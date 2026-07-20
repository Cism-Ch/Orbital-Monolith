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
            (window as any).__scene = sceneRef.current;
        }

        // Initialize Camera if not exists
        if (!cameraRef.current) {
            const camera = new THREE.PerspectiveCamera(
                options.cameraFov || 45,
                containerRef.current.clientWidth / containerRef.current.clientHeight,
                options.cameraNear || 0.1,
                options.cameraFar || 20000
            );
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
            // Clean up WebGLRenderer to avoid memory leaks and remove canvas from DOM
            if (rendererRef.current) {
                const canvas = rendererRef.current.domElement;
                if (canvas && canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }
                rendererRef.current.dispose();
                rendererRef.current = null;
            }
            if (cameraRef.current) {
                cameraRef.current = null;
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
