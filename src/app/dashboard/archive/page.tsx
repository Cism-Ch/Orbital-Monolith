"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, BookOpen, ExternalLink, Sparkles, Shield, Compass, Target } from 'lucide-react';
import { useDashboard } from '@/lib/DashboardContext';
import { useRouter } from 'next/navigation';
import { SOLAR_SYSTEM, STARS } from '@/constants';
import { useNasaTelemetry } from '@/hooks/useNasaTelemetry';

export default function ArchivePage() {
    const [filter, setFilter] = useState<'ALL' | 'SYSTEM' | 'GALAXY' | 'NEO' | 'TECH'>('ALL');
    const { setView, setSelectedBody, setIsFocusMode } = useDashboard();
    const router = useRouter();
    const { neos } = useNasaTelemetry(30000);

    const handleReadIntel = (docId: string) => {
        const targetMap: Record<string, { view: 'SOLAR' | 'SKY', bodyId: string }> = {
            'sol-guide': { view: 'SOLAR', bodyId: 'sun' },
            'const-myth': { view: 'SKY', bodyId: 'polaris' },
            'gaia-catalog': { view: 'SKY', bodyId: 'sirius' },
            'trappist-1': { view: 'SKY', bodyId: 'trappist1' },
            'horizons-ephem': { view: 'SOLAR', bodyId: 'earth' },
            'nasa-dsn': { view: 'SKY', bodyId: 'voyager1' },
            'messier-dso': { view: 'SKY', bodyId: 'm42_orion_nebula' }
        };
        const target = targetMap[docId];
        if (target) {
            const list = target.view === 'SOLAR' ? SOLAR_SYSTEM : STARS;
            const body = list.find(b => b.id === target.bodyId);
            if (body) {
                setView(target.view);
                setSelectedBody(body);
                setIsFocusMode(true);
                router.push('/dashboard');
            }
        }
    };

    const documents = [
        {
            id: 'sol-guide',
            title: 'NASA JPL Planetary Compendium',
            category: 'SYSTEM' as const,
            intel: 'Données astrophysiques certifiées du NASA Jet Propulsion Laboratory (NSSDC) sur les 8 planètes majeures, Cérès et Pluton.',
            tags: ['NASA JPL', 'J2000 Ephemeris', 'Keplerian Mechanics'],
            source: 'NASA Planetary Fact Sheet',
            externalUrl: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/'
        },
        {
            id: 'gaia-catalog',
            title: 'ESA Gaia DR3 Stellar Archive',
            category: 'TECH' as const,
            intel: 'Astométrie stellaire haute précision de plus d\'1 milliard d\'étoiles. Parallaxes, vitesses radiales et spectres photométriques DR3.',
            tags: ['ESA Gaia', 'DR3 Release', '1.8B Stars'],
            source: 'ESA Cosmos Gaia Portal',
            externalUrl: 'https://www.cosmos.esa.int/web/gaia/data-release-3'
        },
        {
            id: 'nasa-dsn',
            title: 'NASA Deep Space Network Now',
            category: 'TECH' as const,
            intel: 'Suivi télémétrique direct des 3 complexes mondiaux (Goldstone, Madrid, Canberra) communiquant avec Voyager 1, Voyager 2, New Horizons et JWST.',
            tags: ['NASA DSN Now', 'Interstellar Probes', '70m Parabolic Dishes'],
            source: 'NASA Eyes on the Solar System (DSN)',
            externalUrl: 'https://eyes.nasa.gov/dsn/dsn.html'
        },
        {
            id: 'horizons-ephem',
            title: 'JPL Horizons On-Line System',
            category: 'SYSTEM' as const,
            intel: 'Générateur officiel d\'éphémérides du système solaire fournissant les vecteurs d\'état DE441 géocentriques et héliocentriques.',
            tags: ['JPL SSD', 'DE441 Integration', 'ICRF Frame'],
            source: 'NASA JPL SSD Horizons',
            externalUrl: 'https://ssd.jpl.nasa.gov/horizons/'
        },
        {
            id: 'const-myth',
            title: 'IAU Official 88 Constellations',
            category: 'GALAXY' as const,
            intel: 'Nomenclature et délimitations officielles des 88 zones célestes ratifiées par l\'Union Astronomique Internationale (UAI).',
            tags: ['IAU Standards', '88 Constellations', 'Celestial Grid'],
            source: 'International Astronomical Union',
            externalUrl: 'https://www.iau.org/public/themes/constellations/'
        },
        {
            id: 'messier-dso',
            title: 'NASA & Hubble Deep Sky Catalog',
            category: 'GALAXY' as const,
            intel: 'Catalogue astrophysique des 110 objets du ciel profond de Charles Messier : nébuleuses diffuses (M42, M1), amas globulaires (M13) et pouponnières stellaires.',
            tags: ['Messier Catalog', 'Emission Nebulae', 'Star Clusters'],
            source: 'NASA Hubble Space Telescope Portal',
            externalUrl: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/'
        },
        {
            id: 'trappist-1',
            title: 'NASA Exoplanet Archive // TRAPPIST-1',
            category: 'GALAXY' as const,
            intel: 'Étude astrobiologique et paramètres spectroscopiques des 7 exoplanètes telluriques du système TRAPPIST-1 à 39.5 années-lumière.',
            tags: ['Exoplanet Archive', 'Infrared Transit', 'James Webb (JWST)'],
            source: 'NASA Exoplanet Science Institute',
            externalUrl: 'https://exoplanetarchive.ipac.caltech.edu/'
        }
    ];

    const filteredDocs = filter === 'ALL' ? documents : documents.filter(d => d.category === filter);


    return (
        <div className="w-full h-full flex flex-col gap-8 p-4 pointer-events-auto pb-24">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 px-2 sm:px-4">
                <div className="bg-black/60 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                        <Database size={18} className="text-[var(--accent-primary)]" />
                        <span className="font-mono text-[9px] uppercase font-black text-white/40 tracking-[0.4em]">Integrated_Archives</span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-widest">Gaia_Repository</h2>
                </div>

                <div className="flex gap-2 bg-black/70 backdrop-blur-3xl p-2 rounded-2xl sm:rounded-full border border-white/10 shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                    {(['ALL', 'SYSTEM', 'GALAXY', 'NEO', 'TECH'] as const).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 sm:px-6 py-2.5 min-h-[44px] rounded-xl sm:rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer ${filter === cat
                                    ? 'bg-[var(--accent-primary)] text-black shadow-lg shadow-[var(--accent-primary)]/20'
                                    : 'text-[#6c6c7a] hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {cat === 'NEO' ? 'NASA Asteroids (NEO)' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 overflow-y-auto px-2 sm:px-4 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Cartes d'Astéroïdes Géocroiseurs Réels NASA JPL (si filtre ALL ou NEO) */}
                    {(filter === 'ALL' || filter === 'NEO') && neos.map((neo) => (
                        <motion.div
                            key={neo.designation}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="monolith-panel !bg-black/85 !backdrop-blur-3xl !rounded-[2.5rem] p-6 sm:p-8 border border-white/10 hover:border-amber-400/40 transition-all flex flex-col gap-5 shadow-2xl relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400">
                                    <Target size={22} />
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                    <span className="text-[7.5px] font-black uppercase text-amber-300 tracking-widest font-mono">LIVE NASA JPL SBDB</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-[9px] font-mono font-bold text-[#8e8e9f] uppercase tracking-widest">
                                    Near-Earth Asteroid (NEO)
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight font-mono">
                                    {neo.designation}
                                </h3>
                                <p className="text-[#8e8e9f] text-xs leading-relaxed font-mono">
                                    Survol terrestre enregistré le <strong className="text-white">{neo.closeApproachDate}</strong>. Trajectoire orbitale géocroiseuse calculée par le JPL Horizons.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 font-mono text-[8.5px]">
                                <div>
                                    <span className="text-[#6c6c7a] uppercase block tracking-wider">Distance de passage</span>
                                    <span className="text-amber-400 font-bold">{neo.missDistanceLd} LD ({neo.missDistanceAu} UA)</span>
                                </div>
                                <div>
                                    <span className="text-[#6c6c7a] uppercase block tracking-wider">Vitesse relative</span>
                                    <span className="text-emerald-400 font-bold">{neo.relativeVelocityKmS} km/s</span>
                                </div>
                                <div>
                                    <span className="text-[#6c6c7a] uppercase block tracking-wider">Diamètre estimé</span>
                                    <span className="text-white font-bold">~{neo.estimatedDiameterM} m</span>
                                </div>
                                <div>
                                    <span className="text-[#6c6c7a] uppercase block tracking-wider">Magnitude absolue</span>
                                    <span className="text-white/80 font-bold">H = {neo.absoluteMagnitudeH}</span>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between text-[8px] font-mono">
                                <span className="text-white/40 uppercase">NASA Close Approach API</span>
                                <a 
                                    href={`https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${encodeURIComponent(neo.designation)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[var(--accent-primary)] hover:underline flex items-center gap-1 font-bold uppercase min-h-[44px]"
                                >
                                    <span>JPL Database</span>
                                    <ExternalLink size={10} />
                                </a>
                            </div>
                        </motion.div>
                    ))}

                    <AnimatePresence mode="popLayout">
                        {filter !== 'NEO' && filteredDocs.map((doc, i) => (
                            <motion.div
                                key={doc.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.08 }}
                                className="monolith-panel !bg-black/80 !backdrop-blur-3xl !rounded-[2.5rem] p-6 sm:p-8 group hover:border-[var(--accent-primary)]/40 transition-all flex flex-col gap-6 shadow-2xl"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent-primary)] group-hover:scale-110 group-hover:bg-[var(--accent-primary)] group-hover:text-black transition-all">
                                        <BookOpen size={22} />
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                                        <Sparkles size={10} className="text-[var(--accent-primary)]" />
                                        <span className="text-[7px] font-black uppercase text-white/40 tracking-widest">{doc.category}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight group-hover:text-[var(--accent-primary)] transition-colors">{doc.title}</h3>
                                    <p className="text-[#6c6c7a] text-xs leading-relaxed font-bold">
                                        {doc.intel}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {doc.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 rounded-full bg-black/40 border border-white/5 text-[7px] font-black uppercase text-white/40 tracking-widest">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                                    <a 
                                        href={doc.externalUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-[8px] font-mono font-bold text-white/60 hover:text-[var(--accent-primary)] transition-colors min-h-[44px]"
                                    >
                                        <Shield size={12} className="text-emerald-400" />
                                        <span className="uppercase">{doc.source}</span>
                                        <ExternalLink size={10} />
                                    </a>
                                    <button 
                                        onClick={() => handleReadIntel(doc.id)}
                                        className="flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-full text-[9px] font-black uppercase text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all cursor-pointer"
                                    >
                                        <span>View 3D</span>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Empty State / Coming Soon */}
                    <div className="monolith-panel !rounded-[2.5rem] p-8 border-dashed border-white/10 flex flex-col items-center justify-center text-center opacity-40">
                        <Compass size={40} className="text-[#6c6c7a] mb-4 animate-spin-slow" />
                        <span className="text-[10px] font-black text-[#6c6c7a] uppercase tracking-[0.3em]">Indexing New Sectors...</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
