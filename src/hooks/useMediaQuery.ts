"use client";

/**
 * @file hooks/useMediaQuery.ts
 * @description Hook React pour détection responsive et ergonomie tactile SSR-safe.
 */

import { useState, useEffect } from 'react';

/**
 * Écoute une requête média CSS de façon réactive.
 * @param query La requête CSS (ex: "(max-width: 767px)")
 * @param defaultValue Valeur initiale (défaut: false pour SSR)
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
    const [matches, setMatches] = useState<boolean>(defaultValue);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const media = window.matchMedia(query);
        setMatches(media.matches);

        const listener = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        if (media.addEventListener) {
            media.addEventListener('change', listener);
        } else {
            // Compatibilité navigateurs plus anciens
            media.addListener(listener);
        }

        return () => {
            if (media.removeEventListener) {
                media.removeEventListener('change', listener);
            } else {
                media.removeListener(listener);
            }
        };
    }, [query]);

    return matches;
}

/**
 * Détecte si l'appareil est en mode mobile (< 768px).
 */
export function useIsMobile(): boolean {
    return useMediaQuery('(max-width: 767px)', false);
}

/**
 * Détecte si le pointeur principal est tactile/grossier (écran tactile).
 */
export function useIsCoarsePointer(): boolean {
    return useMediaQuery('(pointer: coarse)', false);
}
