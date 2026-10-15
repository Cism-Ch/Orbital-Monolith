"use client";

import { useState, useEffect } from 'react';
import type { DSNTelemetry, NearEarthObject } from '@/services/nasaService';

interface NasaTelemetryState {
    dsn: DSNTelemetry | null;
    neos: NearEarthObject[];
    isLoading: boolean;
    error: string | null;
    lastUpdated: Date | null;
}

/**
 * Hook React pour consommer les flux de télémétrie en temps réel
 * de la NASA (Deep Space Network et Near-Earth Objects du JPL).
 */
export function useNasaTelemetry(pollIntervalMs: number = 25000) {
    const [state, setState] = useState<NasaTelemetryState>({
        dsn: null,
        neos: [],
        isLoading: true,
        error: null,
        lastUpdated: null,
    });

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                const res = await fetch('/api/telemetry', {
                    headers: { 'Accept': 'application/json' },
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();

                if (isMounted && json.data) {
                    setState({
                        dsn: json.data.dsn,
                        neos: json.data.neos || [],
                        isLoading: false,
                        error: null,
                        lastUpdated: new Date(),
                    });
                }
            } catch (err: any) {
                if (isMounted) {
                    setState(prev => ({
                        ...prev,
                        isLoading: false,
                        error: err?.message || 'Erreur réseau',
                    }));
                }
            }
        };

        fetchData();
        const timer = setInterval(fetchData, pollIntervalMs);

        return () => {
            isMounted = false;
            clearInterval(timer);
        };
    }, [pollIntervalMs]);

    return state;
}
