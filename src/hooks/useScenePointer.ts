"use client";

/**
 * @file hooks/useScenePointer.ts
 * @description Gestionnaire d'interactions unifiées Pointer Events pour les scènes 3D.
 *
 * Gère de manière fluide :
 * - 1 pointeur (souris ou doigt) : rotation azimut & élévation (inclinaison).
 * - 2 pointeurs (toucher) : pinch-to-zoom & ajustement de perspective.
 * - Molette souris : zoom fluide sur desktop.
 * - Détection de Tap robuste : distingue un tap (sélection d'astre) d'un glissement (rotation de scène).
 * - Survol (Hover) : activé sur souris uniquement pour préserver les performances tactiles.
 */

import { useEffect, useRef } from 'react';

export interface ScenePointerOptions {
    /** Élément cible sur lequel attacher les événements (ex: renderer.domElement) */
    element: HTMLElement | null;
    /** Activation globale du gestionnaire */
    enabled?: boolean;
    /** Callback de rotation relative (delta azimut en degrés, delta inclinaison en degrés) */
    onRotate?: (deltaRotation: number, deltaInclination: number) => void;
    /** Callback de zoom (variation relative de zoom) */
    onZoom?: (zoomFactor: number) => void;
    /** Callback déclenché lors d'un tap / clic confirmé sur la scène */
    onTap?: (event: PointerEvent, ndc: { x: number; y: number }) => void;
    /** Callback de survol (souris uniquement) */
    onHover?: (ndc: { x: number; y: number } | null) => void;
}

interface PointerRecord {
    x: number;
    y: number;
    startX: number;
    startY: number;
    startTime: number;
}

export function useScenePointer({
    element,
    enabled = true,
    onRotate,
    onZoom,
    onTap,
    onHover,
}: ScenePointerOptions) {
    // Références pour éviter les re-créations d'écouteurs à chaque rendu
    const onRotateRef = useRef(onRotate);
    const onZoomRef = useRef(onZoom);
    const onTapRef = useRef(onTap);
    const onHoverRef = useRef(onHover);

    useEffect(() => {
        onRotateRef.current = onRotate;
        onZoomRef.current = onZoom;
        onTapRef.current = onTap;
        onHoverRef.current = onHover;
    });

    useEffect(() => {
        if (!element || !enabled) return;

        const activePointers = new Map<number, PointerRecord>();
        let initialPinchDist: number | null = null;

        // Calcul des coordonnées NDC (-1 à +1)
        const getNDC = (clientX: number, clientY: number) => {
            const rect = element.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
            return {
                x: ((clientX - rect.left) / rect.width) * 2 - 1,
                y: -((clientY - rect.top) / rect.height) * 2 + 1,
            };
        };

        // Calcul de la distance euclidienne entre 2 pointeurs
        const getPointersDistance = (p1: PointerRecord, p2: PointerRecord) => {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            return Math.sqrt(dx * dx + dy * dy);
        };

        // ── POINTER DOWN ────────────────────────────────────────────────────────
        const handlePointerDown = (e: PointerEvent) => {
            // Ignorer si le clic provient d'une UI interactive
            const target = e.target as HTMLElement | null;
            if (target && target !== element && target.closest('button, input, a, aside, nav, .pointer-events-auto')) {
                return;
            }

            try {
                element.setPointerCapture(e.pointerId);
            } catch {
                // Ignore si l'élément n'est pas encore capturable
            }

            activePointers.set(e.pointerId, {
                x: e.clientX,
                y: e.clientY,
                startX: e.clientX,
                startY: e.clientY,
                startTime: Date.now(),
            });

            if (activePointers.size === 2) {
                const [p1, p2] = Array.from(activePointers.values());
                initialPinchDist = getPointersDistance(p1, p2);
            }
        };

        // ── POINTER MOVE ────────────────────────────────────────────────────────
        const handlePointerMove = (e: PointerEvent) => {
            const currentRecord = activePointers.get(e.pointerId);

            // Cas A : Survol passif à la souris (aucun bouton pressé)
            if (!currentRecord) {
                if (e.pointerType === 'mouse' && onHoverRef.current) {
                    const ndc = getNDC(e.clientX, e.clientY);
                    onHoverRef.current(ndc);
                }
                return;
            }

            // Cas B : 2 pointeurs = Pinch to Zoom
            if (activePointers.size >= 2) {
                currentRecord.x = e.clientX;
                currentRecord.y = e.clientY;

                const [p1, p2] = Array.from(activePointers.values());
                const currentDist = getPointersDistance(p1, p2);

                if (initialPinchDist && initialPinchDist > 0 && currentDist > 0) {
                    const zoomDelta = (currentDist - initialPinchDist) * 0.005;
                    if (Math.abs(zoomDelta) > 0.001 && onZoomRef.current) {
                        onZoomRef.current(zoomDelta);
                    }
                    initialPinchDist = currentDist;
                }
                return;
            }

            // Cas C : 1 pointeur = Glissement / Rotation
            if (activePointers.size === 1) {
                const deltaX = e.clientX - currentRecord.x;
                const deltaY = e.clientY - currentRecord.y;

                currentRecord.x = e.clientX;
                currentRecord.y = e.clientY;

                if (onRotateRef.current) {
                    // Vitesse de rotation adaptée : ~0.4° par pixel
                    const deltaRot = deltaX * 0.45;
                    const deltaInc = -deltaY * 0.25;
                    onRotateRef.current(deltaRot, deltaInc);
                }
            }
        };

        // ── POINTER UP & CANCEL ─────────────────────────────────────────────────
        const handlePointerUp = (e: PointerEvent) => {
            const record = activePointers.get(e.pointerId);

            if (record) {
                const travelDist = Math.hypot(e.clientX - record.startX, e.clientY - record.startY);
                const elapsed = Date.now() - record.startTime;

                // Critère de Tap : moins de 8 pixels de mouvement et moins de 320ms
                if (travelDist < 8 && elapsed < 320 && onTapRef.current) {
                    const ndc = getNDC(e.clientX, e.clientY);
                    onTapRef.current(e, ndc);
                }

                try {
                    element.releasePointerCapture(e.pointerId);
                } catch {
                    // Ignore
                }
                activePointers.delete(e.pointerId);
            }

            if (activePointers.size < 2) {
                initialPinchDist = null;
            }
        };

        // ── POINTER LEAVE ───────────────────────────────────────────────────────
        const handlePointerLeave = (e: PointerEvent) => {
            if (e.pointerType === 'mouse' && onHoverRef.current && activePointers.size === 0) {
                onHoverRef.current(null);
            }
        };

        // ── WHEEL ZOOM (Desktop) ────────────────────────────────────────────────
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (onZoomRef.current) {
                // Normalisation molette (sens naturel vers l'avant = zoom avant)
                const zoomDelta = -Math.sign(e.deltaY) * 0.08;
                onZoomRef.current(zoomDelta);
            }
        };

        // Enregistrement des écouteurs
        element.addEventListener('pointerdown', handlePointerDown);
        element.addEventListener('pointermove', handlePointerMove);
        element.addEventListener('pointerup', handlePointerUp);
        element.addEventListener('pointercancel', handlePointerUp);
        element.addEventListener('pointerleave', handlePointerLeave);
        element.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            element.removeEventListener('pointerdown', handlePointerDown);
            element.removeEventListener('pointermove', handlePointerMove);
            element.removeEventListener('pointerup', handlePointerUp);
            element.removeEventListener('pointercancel', handlePointerUp);
            element.removeEventListener('pointerleave', handlePointerLeave);
            element.removeEventListener('wheel', handleWheel);
            activePointers.clear();
        };
    }, [element, enabled]);
}
