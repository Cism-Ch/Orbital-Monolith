"use client";

import { useState, useEffect } from 'react';

export interface TelemetryLog {
    id: string;
    timestamp: string;
    event: string;
    value: string;
    status: 'OPTIMAL' | 'STABLE' | 'WARNING';
}

export function useTelemetry(limit: number = 20) {
    const [logs, setLogs] = useState<TelemetryLog[]>([]);

    useEffect(() => {
        const events = [
            "ORBITAL_STABILIZATION",
            "SPECTRAL_ANALYSIS",
            "GRAVITY_WELL_DETECTION",
            "CORE_SYNC_PROTOCOL",
            "THERMAL_REGULATION",
            "DATA_LINK_ESTABLISHED"
        ];

        const generateLog = (): TelemetryLog => ({
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
            event: events[Math.floor(Math.random() * events.length)],
            value: (Math.random() * 100).toFixed(2) + (Math.random() > 0.5 ? " %" : " KM/s"),
            status: Math.random() > 0.9 ? 'WARNING' : 'STABLE'
        });

        const interval = setInterval(() => {
            setLogs(prev => {
                const next = [...prev, generateLog()];
                return next.slice(-limit);
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [limit]);

    return logs;
}
