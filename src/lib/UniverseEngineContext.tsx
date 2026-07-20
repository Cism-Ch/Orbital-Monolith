"use client";

/**
 * @file lib/UniverseEngineContext.tsx
 * @description Contexte React du moteur WebGL 3D persistant — Orbital Monolith v3.
 *
 * Architecture :
 * - Un seul WebGLRenderer est créé pour toute la durée de vie du dashboard.
 * - Le canvas est attaché au `containerRef` exposé par ce contexte.
 * - Les composants de vue (SolarSystemView, SkyMapView) consomment `useUniverseEngine()`
 *   pour accéder à la scène partagée et enregistrer leurs boucles d'animation.
 * - `registerAnimation` retourne une fonction de cleanup qui supprime le callback.
 * - `isReady` passe à `true` uniquement après que le renderer est monté sur le DOM.
 *
 * Pattern animation :
 *   const cleanup = registerAnimation((time, scene, camera) => { ... });
 *   return () => cleanup();
 */

import React, {
    createContext,
    useContext,
    useRef,
    useEffect,
    useState,
    useCallback,
    type RefObject,
} from 'react';
import * as THREE from 'three';

// ── Type du callback d'animation ──────────────────────────────────────────────

/** Signature d'un callback enregistré dans la boucle de rendu */
type AnimationCallback = (
    time: number,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
) => void;

// ── Interface du contexte ─────────────────────────────────────────────────────

interface UniverseEngineContextValue {
    /** Référence sur la scène Three.js partagée */
    scene: THREE.Scene;
    /** Référence vers la caméra perspective globale */
    camera: RefObject<THREE.PerspectiveCamera | null>;
    /** Référence vers le renderer WebGL */
    renderer: RefObject<THREE.WebGLRenderer | null>;
    /** Référence sur le div DOM où le canvas est monté */
    containerRef: RefObject<HTMLDivElement | null>;
    /**
     * Enregistre un callback dans la boucle RAF globale.
     * @returns fonction de nettoyage — DOIT être appelée dans le useEffect cleanup
     */
    registerAnimation: (cb: AnimationCallback) => () => void;
    /** `true` une fois que le renderer et le canvas sont opérationnels */
    isReady: boolean;
}

// ── Création du contexte ──────────────────────────────────────────────────────

const UniverseEngineContext = createContext<UniverseEngineContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * UniverseEngineProvider — À placer une seule fois dans le DashboardLayout.
 * Tous les enfants partagent le même renderer/scène/caméra WebGL.
 */
export function UniverseEngineProvider({ children }: { children: React.ReactNode }) {
    // ── Refs ────────────────────────────────────────────────────────────────────
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rafIdRef = useRef<number | null>(null);
    // Map des callbacks actifs : clé = id unique, valeur = callback
    const callbacksRef = useRef<Map<number, AnimationCallback>>(new Map());
    const nextIdRef = useRef(0);

    const [isReady, setIsReady] = useState(false);

    // ── Initialisation WebGL (une seule fois au montage) ────────────────────────
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Caméra perspective avec ratio réel du conteneur
        const camera = new THREE.PerspectiveCamera(
            60,
            container.clientWidth / Math.max(container.clientHeight, 1),
            0.1,
            50000
        );
        camera.position.set(0, 0, 1500);
        cameraRef.current = camera;

        // Renderer WebGL avec antialiasing et support HDR
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setClearColor(0x000000, 1);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        rendererRef.current = renderer;

        // Injection du canvas dans le conteneur DOM
        container.appendChild(renderer.domElement);

        // Signaler que le moteur est prêt
        setIsReady(true);

        // ── Boucle RAF principale ───────────────────────────────────────────────
        let prevTime = 0;
        const animate = (timestamp: number) => {
            rafIdRef.current = requestAnimationFrame(animate);
            const time = timestamp * 0.001; // Convertir ms → secondes

            // Exécuter tous les callbacks enregistrés
            callbacksRef.current.forEach((cb) => {
                cb(time, sceneRef.current, cameraRef.current!);
            });

            renderer.render(sceneRef.current, cameraRef.current!);
            prevTime = time;
        };
        rafIdRef.current = requestAnimationFrame(animate);
        void prevTime; // éviter warning "unused var"

        // ── Gestionnaire de perte/restauration du contexte WebGL ────────────────
        const handleContextLost = (e: Event) => {
            e.preventDefault();
            console.warn('[UniverseEngine] WebGL Context Lost. Intercepting...');
        };
        const handleContextRestored = () => {
            console.log('[UniverseEngine] WebGL Context Restored. Re-initializing view...');
            renderer.setSize(container.clientWidth, container.clientHeight);
        };

        const canvasEl = renderer.domElement;
        canvasEl.addEventListener('webglcontextlost', handleContextLost, false);
        canvasEl.addEventListener('webglcontextrestored', handleContextRestored, false);

        // ── Resize observer (réactivité au changement de taille) ────────────────
        const resizeObserver = new ResizeObserver(() => {
            if (!container || !renderer || !camera) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            if (w === 0 || h === 0) return;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });
        resizeObserver.observe(container);

        // ── Cleanup complet ─────────────────────────────────────────────────────
        return () => {
            setIsReady(false);
            canvasEl.removeEventListener('webglcontextlost', handleContextLost);
            canvasEl.removeEventListener('webglcontextrestored', handleContextRestored);
            resizeObserver.disconnect();
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
            callbacksRef.current.clear();

            // Disposal des ressources GPU
            sceneRef.current.traverse((obj) => {
                if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
                const mat = (obj as THREE.Mesh).material;
                if (mat) {
                    if (Array.isArray(mat)) mat.forEach(m => m.dispose());
                    else (mat as THREE.Material).dispose();
                }
            });
            renderer.dispose();

            // Retirer le canvas du DOM
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            rendererRef.current = null;
            cameraRef.current = null;
        };
    }, []); // intentionnellement vide : init une seule fois

    // ── API : registerAnimation ─────────────────────────────────────────────────
    const registerAnimation = useCallback((cb: AnimationCallback): (() => void) => {
        const id = nextIdRef.current++;
        callbacksRef.current.set(id, cb);
        return () => {
            callbacksRef.current.delete(id);
        };
    }, []);

    // ── Valeur du contexte ──────────────────────────────────────────────────────
    const value: UniverseEngineContextValue = {
        scene: sceneRef.current,
        camera: cameraRef,
        renderer: rendererRef,
        containerRef,
        registerAnimation,
        isReady,
    };

    return (
        <UniverseEngineContext.Provider value={value}>
            {children}
        </UniverseEngineContext.Provider>
    );
}

// ── Hook consommateur ─────────────────────────────────────────────────────────

/**
 * useUniverseEngine — Accède au moteur 3D partagé.
 * @throws Error si utilisé hors d'un UniverseEngineProvider
 */
export function useUniverseEngine(): UniverseEngineContextValue {
    const ctx = useContext(UniverseEngineContext);
    if (!ctx) {
        throw new Error(
            '[UniverseEngine] useUniverseEngine() doit être utilisé dans un <UniverseEngineProvider>.'
        );
    }
    return ctx;
}
