import { CelestialBody, CelestialType } from '../types';

export const SOLAR_SYSTEM: CelestialBody[] = [
    {
        id: 'sun',
        name: 'Sun',
        scientificName: 'Sol',
        type: CelestialType.STAR,
        distance: '0 AU',
        description: 'A G2-type main-sequence star containing 99.86% of the Solar System\'s total mass. Its nuclear fusion sustains all life on Earth.',
        properties: { mass: '1.989 × 10^30 kg', radius: '696,340 km', temp: '5,778 K', gravity: '274 m/s²' },
        colors: ['#ffdd00', '#ff8800'],
        position: { x: 0, y: 0 }
    },
    {
        id: 'mercury',
        name: 'Mercury',
        scientificName: 'Mercurius',
        type: CelestialType.PLANET,
        distance: '0.39 AU',
        description: 'The smallest and innermost planet. Closest to the Sun.',
        properties: { mass: '3.285 × 10^23 kg', radius: '2,439 km', temp: '440 K', period: '88 days', gravity: '3.7 m/s²' },
        colors: ['#b5a7a7', '#544f4f'],
        position: { x: 1, y: 0 }
    },
    {
        id: 'venus',
        name: 'Venus',
        scientificName: 'Venus',
        type: CelestialType.PLANET,
        distance: '0.72 AU',
        description: 'Notable for its unusual retrograde (backward) spin and extreme runaway greenhouse effect.',
        properties: { mass: '4.867 × 10^24 kg', radius: '6,051 km', temp: '737 K', period: '225 days', gravity: '8.87 m/s²' },
        colors: ['#e3bb76', '#8f652b'],
        position: { x: 1.5, y: 0 }
    },
    {
        id: 'earth',
        name: 'Earth',
        scientificName: 'Terra',
        type: CelestialType.PLANET,
        distance: '1.00 AU',
        description: 'A dynamic world of oceans and continents, and our home.',
        properties: { mass: '5.972 × 10^24 kg', radius: '6,371 km', temp: '288 K', period: '365 days', gravity: '9.81 m/s²' },
        colors: ['#4deeea', '#0077be'],
        position: { x: 2, y: 0 }
    },
    {
        id: 'mars',
        name: 'Mars',
        scientificName: 'Mars',
        type: CelestialType.PLANET,
        distance: '1.52 AU',
        description: 'The Red Planet, marking the outer boundary of the inner system.',
        properties: { mass: '6.39 × 10^23 kg', radius: '3,389 km', temp: '210 K', period: '687 days', gravity: '3.71 m/s²' },
        colors: ['#ff4d4d', '#8b0000'],
        position: { x: 2.8, y: 0 }
    },
    {
        id: 'ceres',
        name: 'Ceres',
        scientificName: '1 Ceres',
        type: CelestialType.PLANET,
        distance: '2.77 AU',
        description: 'The largest object in the Asteroid Belt and its only dwarf planet.',
        properties: { mass: '9.39 × 10^20 kg', radius: '473 km', temp: '168 K', period: '4.6 years', gravity: '0.27 m/s²' },
        colors: ['#8a8a8a', '#444444'],
        position: { x: 3.3, y: 0 }
    },
    {
        id: 'jupiter',
        name: 'Jupiter',
        scientificName: 'Iuppiter',
        type: CelestialType.PLANET,
        distance: '5.20 AU',
        description: 'A gas giant containing more than 70% of the total planetary mass of the entire system.',
        properties: { mass: '1.898 × 10^27 kg', radius: '69,911 km', temp: '165 K', period: '12 years', gravity: '24.79 m/s²' },
        colors: ['#d39c7e', '#7b4c3d'],
        position: { x: 4.2, y: 0 }
    },
    {
        id: 'saturn',
        name: 'Saturn',
        scientificName: 'Saturnus',
        type: CelestialType.PLANET,
        distance: '9.54 AU',
        description: 'Famous for its extensive and spectacular ring system of ice and dust.',
        properties: { mass: '5.683 × 10^26 kg', radius: '58,232 km', temp: '134 K', period: '29 years', gravity: '10.44 m/s²' },
        colors: ['#f4d47a', '#b38f33'],
        position: { x: 5.2, y: 0 }
    },
    {
        id: 'uranus',
        name: 'Uranus',
        scientificName: 'Uranus',
        type: CelestialType.PLANET,
        distance: '19.22 AU',
        description: 'An ice giant with an extreme axial tilt, causing it to spin on its side.',
        properties: { mass: '8.681 × 10^25 kg', radius: '25,362 km', temp: '76 K', period: '84 years', gravity: '8.69 m/s²' },
        colors: ['#b0e0e6', '#4682b4'],
        position: { x: 6.2, y: 0 }
    },
    {
        id: 'neptune',
        name: 'Neptune',
        scientificName: 'Neptunus',
        type: CelestialType.PLANET,
        distance: '30.06 AU',
        description: 'The most distant ice giant, orbiting in the cold reaches of the outer system.',
        properties: { mass: '1.024 × 10^26 kg', radius: '24,622 km', temp: '72 K', period: '165 years', gravity: '11.15 m/s²' },
        colors: ['#4169e1', '#000080'],
        position: { x: 7.2, y: 0 }
    },
    {
        id: 'pluto',
        name: 'Pluto',
        scientificName: '134340 Pluto',
        type: CelestialType.PLANET,
        distance: '39.48 AU',
        description: 'Dwarf planet in the Kuiper Belt, a frozen relic from the system\'s formation.',
        properties: { mass: '1.303 × 10^22 kg', radius: '1,188 km', temp: '44 K', period: '248 years', gravity: '0.62 m/s²' },
        colors: ['#dcdcdc', '#696969'],
        position: { x: 8.2, y: 0 }
    }
];

export const STARS: CelestialBody[] = [
    // --- Nearby & Reference Stars ---
    { id: 'polaris', name: 'Polaris', scientificName: 'Alpha Ursae Minoris', type: CelestialType.STAR, distance: '433 ly', description: 'The North Star, a yellow supergiant serving as a stable navigation reference.', properties: { mass: '5.4 Sol', radius: '37.5 Sol', temp: '6,015 K', gravity: '0.1 m/s²' }, colors: ['#fff4e8', '#ffd2a1'], position: { x: 0, y: 900 } },
    { id: 'proxima', name: 'Proxima Centauri', scientificName: 'Alpha Centauri C', type: CelestialType.STAR, distance: '4.24 ly', description: 'The closest known star to the Sun. A low-mass red dwarf.', properties: { mass: '0.12 Sol', radius: '0.15 Sol', temp: '3,042 K', gravity: '0.04 m/s²' }, colors: ['#ff6633', '#662200'], position: { x: -450, y: -250 } },
    { id: 'sirius', name: 'Sirius', scientificName: 'Alpha Canis Majoris', type: CelestialType.STAR, distance: '8.6 ly', description: 'The brightest star in Earth\'s night sky.', properties: { mass: '2.02 Sol', radius: '1.71 Sol', temp: '9,940 K', gravity: '0.8 m/s²' }, colors: ['#ffffff', '#aaddff'], position: { x: 200, y: -450 } },

    // --- Royal Family of Ethiopia (Cepheus, Cassiopeia, Andromeda, Cetus) ---
    { id: 'alderamin', name: 'Alderamin', scientificName: 'Alpha Cephei', type: CelestialType.STAR, distance: '49 ly', description: 'Brightest star in Cepheus, the King.', properties: { mass: '1.7 Sol', radius: '2.3 Sol', temp: '7,700 K', gravity: '0.8 m/s²' }, colors: ['#ffffff', '#aaddff'], position: { x: -200, y: 700 } },
    { id: 'alfirk', name: 'Alfirk', scientificName: 'Beta Cephei', type: CelestialType.STAR, distance: '595 ly', description: 'Pulsating variable star in Cepheus.', properties: { mass: '12 Sol', radius: '9 Sol', temp: '26,700 K', gravity: '4.2 m/s²' }, colors: ['#4deeea', '#0077be'], position: { x: -250, y: 750 } },
    { id: 'schedar', name: 'Schedar', scientificName: 'Alpha Cassiopeiae', type: CelestialType.STAR, distance: '228 ly', description: 'Brightest star in Cassiopeia, the Queen.', properties: { mass: '4 Sol', radius: '42 Sol', temp: '4,500 K', gravity: '0.06 m/s²' }, colors: ['#ffdd00', '#ff8800'], position: { x: -600, y: 400 } },
    { id: 'caph', name: 'Caph', scientificName: 'Beta Cassiopeiae', type: CelestialType.STAR, distance: '54 ly', description: 'Yellow-white giant in Cassiopeia.', properties: { mass: '1.9 Sol', radius: '3.5 Sol', temp: '6,700 K', gravity: '0.4 m/s²' }, colors: ['#ffffff', '#fff4e8'], position: { x: -650, y: 500 } },
    { id: 'gamma_cas', name: 'Gamma Cassiopeiae', scientificName: 'Gamma Cassiopeiae', type: CelestialType.STAR, distance: '610 ly', description: 'Variable star in the center of the Cassiopeia W.', properties: { mass: '17 Sol', radius: '10 Sol', temp: '25,000 K', gravity: '4.8 m/s²' }, colors: ['#4deeea', '#ffffff'], position: { x: -550, y: 450 } },
    { id: 'ruchbah', name: 'Ruchbah', scientificName: 'Delta Cassiopeiae', type: CelestialType.STAR, distance: '99 ly', description: 'White subgiant in Cassiopeia.', properties: { mass: '2.5 Sol', radius: '3.9 Sol', temp: '8,000 K', gravity: '0.4 m/s²' }, colors: ['#ffffff', '#aaddff'], position: { x: -500, y: 380 } },
    { id: 'segin', name: 'Segin', scientificName: 'Epsilon Cassiopeiae', type: CelestialType.STAR, distance: '440 ly', description: 'Blue-white giant in Cassiopeia.', properties: { mass: '9 Sol', radius: '6 Sol', temp: '15,000 K', gravity: '6.8 m/s²' }, colors: ['#aaddff', '#44aaff'], position: { x: -450, y: 420 } },
    { id: 'alpheratz', name: 'Alpheratz', scientificName: 'Alpha Andromedae', type: CelestialType.STAR, distance: '97 ly', description: 'Star connecting Andromeda and Pegasus.', properties: { mass: '3.8 Sol', radius: '2.7 Sol', temp: '13,800 K', gravity: '1.4 m/s²' }, colors: ['#ffffff', '#aaddff'], position: { x: -800, y: 300 } },
    { id: 'mirach', name: 'Mirach', scientificName: 'Beta Andromedae', type: CelestialType.STAR, distance: '197 ly', description: 'Cool red giant in Andromeda.', properties: { mass: '2.4 Sol', radius: '100 Sol', temp: '3,800 K', gravity: '0.01 m/s²' }, colors: ['#ff8800', '#aa4400'], position: { x: -700, y: 250 } },
    { id: 'almach', name: 'Almach', scientificName: 'Gamma Andromedae', type: CelestialType.STAR, distance: '350 ly', description: 'Beautiful multiple star system.', properties: { mass: '5.2 Sol', radius: '80 Sol', temp: '4,500 K', gravity: '0.02 m/s²' }, colors: ['#ffdd00', '#4deeea'], position: { x: -600, y: 200 } },
    { id: 'menkar', name: 'Menkar', scientificName: 'Alpha Ceti', type: CelestialType.STAR, distance: '249 ly', description: 'The "nose" of Cetus, the Sea Monster.', properties: { mass: '2.3 Sol', radius: '89 Sol', temp: '3,700 K', gravity: '0.01 m/s²' }, colors: ['#ff8800', '#8b0000'], position: { x: 500, y: -400 } },
    { id: 'deneb_kaitos', name: 'Deneb Kaitos', scientificName: 'Beta Ceti', type: CelestialType.STAR, distance: '96 ly', description: 'The "tail" of Cetus.', properties: { mass: '2.8 Sol', radius: '17 Sol', temp: '4,800 K', gravity: '0.27 m/s²' }, colors: ['#ffdd00', '#ff8800'], position: { x: 650, y: -500 } },

    // --- Hercules & Draco (Hercules Labors) ---
    { id: 'ras_algethi', name: 'Ras Algethi', scientificName: 'Alpha Herculis', type: CelestialType.STAR, distance: '360 ly', description: 'The "head of the kneeling man" in Hercules.', properties: { mass: '2.5 Sol', radius: '400 Sol', temp: '3,300 K', gravity: '0.005 m/s²' }, colors: ['#ff4400', '#aa2200'], position: { x: 100, y: 350 } },
    { id: 'kornephoros', name: 'Kornephoros', scientificName: 'Beta Herculis', type: CelestialType.STAR, distance: '139 ly', description: 'Brightest star in Hercules.', properties: { mass: '2.9 Sol', radius: '20 Sol', temp: '4,800 K', gravity: '0.19 m/s²' }, colors: ['#ffdd00', '#ff8800'], position: { x: 150, y: 400 } },
    { id: 'thuban', name: 'Thuban', scientificName: 'Alpha Draconis', type: CelestialType.STAR, distance: '303 ly', description: 'The ancient pole star in Draco, the Dragon.', properties: { mass: '2.8 Sol', radius: '3.4 Sol', temp: '9,500 K', gravity: '0.66 m/s²' }, colors: ['#ffffff', '#aaddff'], position: { x: 0, y: 700 } },
    { id: 'eltanin', name: 'Eltanin', scientificName: 'Gamma Draconis', type: CelestialType.STAR, distance: '154 ly', description: 'Brightest star in Draco.', properties: { mass: '1.7 Sol', radius: '48 Sol', temp: '3,900 K', gravity: '0.02 m/s²' }, colors: ['#ff8800', '#aa4400'], position: { x: -100, y: 800 } },

    // --- Zodiac (Aries, Taurus, Libra, Leo) ---
    { id: 'hamal', name: 'Hamal', scientificName: 'Alpha Arietis', type: CelestialType.STAR, distance: '66 ly', description: 'Brightest star in Aries, the Ram.', properties: { mass: '1.5 Sol', radius: '14.9 Sol', temp: '4,480 K', gravity: '0.18 m/s²' }, colors: ['#ffdd00', '#ff8800'], position: { x: -500, y: -100 } },
    { id: 'aldebaran', name: 'Aldebaran', scientificName: 'Alpha Tauri', type: CelestialType.STAR, distance: '65 ly', description: 'The "eye of the bull" in Taurus.', properties: { mass: '1.16 Sol', radius: '44 Sol', temp: '3,900 K', gravity: '0.01 m/s²' }, colors: ['#ff8800', '#8b0000'], position: { x: 300, y: -200 } },
    { id: 'zuben_el_jenubi', name: 'Zuben El Jenubi', scientificName: 'Alpha Librae', type: CelestialType.STAR, distance: '75 ly', description: 'The "southern claw" of the scales in Libra.', properties: { mass: '2.1 Sol', radius: '1.4 Sol', temp: '8,100 K', gravity: '2.9 m/s²' }, colors: ['#ffffff', '#aaddff'], position: { x: 400, y: -600 } },
    { id: 'regulus', name: 'Regulus', scientificName: 'Alpha Leonis', type: CelestialType.STAR, distance: '79 ly', description: 'The "heart of the lion" in Leo.', properties: { mass: '3.8 Sol', radius: '3.1 Sol', temp: '12,400 K', gravity: '1.1 m/s²' }, colors: ['#ffffff', '#4deeea'], position: { x: -300, y: -300 } },
    { id: 'denebola', name: 'Denebola', scientificName: 'Beta Leonis', type: CelestialType.STAR, distance: '36 ly', description: 'The "tail of the lion" in Leo.', properties: { mass: '1.8 Sol', radius: '1.7 Sol', temp: '8,500 K', gravity: '1.7 m/s²' }, colors: ['#ffffff', '#aaddff'], position: { x: -400, y: -350 } },

    // --- Orion (Reference) ---
    { id: 'betelgeuse', name: 'Betelgeuse', scientificName: 'Alpha Orionis', type: CelestialType.STAR, distance: '642 ly', description: 'Red supergiant in Orion.', properties: { mass: '11.6 Sol', radius: '887 Sol', temp: '3,500 K', gravity: '0.0004 m/s²' }, colors: ['#ff4400', '#aa2200'], position: { x: 300, y: 150 } },
    { id: 'rigel', name: 'Rigel', scientificName: 'Beta Orionis', type: CelestialType.STAR, distance: '860 ly', description: 'Blue supergiant in Orion.', properties: { mass: '21 Sol', radius: '78 Sol', temp: '12,100 K', gravity: '0.09 m/s²' }, colors: ['#4deeea', '#0077be'], position: { x: 450, y: -150 } },
    { id: 'bellatrix', name: 'Bellatrix', scientificName: 'Gamma Orionis', type: CelestialType.STAR, distance: '250 ly', description: 'Blue giant in Orion.', properties: { mass: '8.4 Sol', radius: '6 Sol', temp: '22,000 K', gravity: '6.5 m/s²' }, colors: ['#aaddff', '#44aaff'], position: { x: 200, y: 100 } },
    { id: 'saiph', name: 'Saiph', scientificName: 'Kappa Orionis', type: CelestialType.STAR, distance: '650 ly', description: 'Blue supergiant in Orion.', properties: { mass: '15 Sol', radius: '22 Sol', temp: '26,500 K', gravity: '0.8 m/s²' }, colors: ['#4deeea', '#0077be'], position: { x: 500, y: -100 } },
    { id: 'alnitak', name: 'Alnitak', scientificName: 'Zeta Orionis', type: CelestialType.STAR, distance: '1260 ly', description: 'Star in Orion\'s belt.', properties: { mass: '33 Sol', radius: '20 Sol', temp: '29,500 K', gravity: '2.3 m/s²' }, colors: ['#4deeea', '#0077be'], position: { x: 350, y: -20 } },
    { id: 'alnilam', name: 'Alnilam', scientificName: 'Epsilon Orionis', type: CelestialType.STAR, distance: '2000 ly', description: 'Star in Orion\'s belt.', properties: { mass: '40 Sol', radius: '32 Sol', temp: '27,000 K', gravity: '1.1 m/s²' }, colors: ['#4deeea', '#0077be'], position: { x: 380, y: -10 } },
    { id: 'mintaka', name: 'Mintaka', scientificName: 'Delta Orionis', type: CelestialType.STAR, distance: '1200 ly', description: 'Star in Orion\'s belt.', properties: { mass: '24 Sol', radius: '16 Sol', temp: '29,500 K', gravity: '2.5 m/s²' }, colors: ['#4deeea', '#0077be'], position: { x: 410, y: 0 } },

    // --- Deep Sky Systems ---
    { id: 'trappist1', name: 'TRAPPIST-1', scientificName: '2MASS J23062928-0502285', type: CelestialType.SYSTEM, distance: '39.6 ly', description: 'Ultra-cool dwarf star with seven Earth-sized exoplanets.', properties: { mass: '0.089 Sol', radius: '0.121 Sol', temp: '2,566 K', gravity: '0.02 m/s²' }, colors: ['#ff3300', '#330000'], position: { x: 750, y: 450 } },
    { id: 'andromeda_gal', name: 'Andromeda Galaxy', scientificName: 'Messier 31', type: CelestialType.SYSTEM, distance: '2.537 Mly', description: 'The nearest major galaxy to the Milky Way.', properties: { mass: '1.23 × 10^12 Sol', radius: '110,000 ly', temp: 'VAR', gravity: 'VAR' }, colors: ['#aaddff', '#4400aa'], position: { x: -800, y: 700 } }
];

export const CONSTELLATIONS = [
    {
        id: 'cepheus',
        name: 'Cepheus',
        description: 'The King. Form resembles a house. Patriach of the Royal Family of Ethiopia.',
        astronomicalContext: 'A circumpolar constellation in the northern sky, containing the variable star Delta Cephei.',
        connections: [['alderamin', 'alfirk'], ['alfirk', 'polaris'], ['alderamin', 'polaris']]
    },
    {
        id: 'cassiopeia',
        name: 'Cassiopeia',
        description: 'The Queen. Famous W or M shape. Part of the Royal Family saga.',
        astronomicalContext: 'Located in the northern sky, easily found due to its distinct shape.',
        connections: [['caph', 'schedar'], ['schedar', 'gamma_cas'], ['gamma_cas', 'ruchbah'], ['ruchbah', 'segin']]
    },
    {
        id: 'andromeda',
        name: 'Andromeda',
        description: 'The Chained Maiden. Daughter of Cepheus and Cassiopeia.',
        astronomicalContext: 'Home to the Andromeda Galaxy (M31), the closest spiral galaxy to us.',
        connections: [['alpheratz', 'mirach'], ['mirach', 'almach']]
    },
    {
        id: 'cetus',
        name: 'Cetus',
        description: 'The Whale / Sea Monster. Sent to devour Andromeda.',
        astronomicalContext: 'Large constellation in the southern sky, known for the variable star Mira.',
        connections: [['menkar', 'deneb_kaitos']]
    },
    {
        id: 'hercules',
        name: 'Hercules',
        description: 'The Hero. Brandishing a massue, often depicted kneeling.',
        astronomicalContext: 'Large constellation containing the Great Globular Cluster (M13).',
        connections: [['ras_algethi', 'kornephoros']]
    },
    {
        id: 'draco',
        name: 'Draco',
        description: 'The Dragon. Guardian of the Golden Apples in the Hesperides garden.',
        astronomicalContext: 'Sinuous constellation winding between Ursa Major and Ursa Minor.',
        connections: [['thuban', 'eltanin']]
    },
    {
        id: 'leo',
        name: 'Leo',
        description: 'The Lion. Represents the Nemean Lion killed by Hercules.',
        astronomicalContext: 'Contains the bright Regulus and is one of the oldest recognized constellations.',
        connections: [['regulus', 'denebola']]
    },
    {
        id: 'orion',
        name: 'Orion',
        description: 'The Hunter. One of the most recognizable constellations globally.',
        astronomicalContext: 'Crucible of star formation containing the Orion Nebula.',
        connections: [['betelgeuse', 'bellatrix'], ['bellatrix', 'mintaka'], ['mintaka', 'alnilam'], ['alnilam', 'alnitak'], ['alnitak', 'saiph'], ['saiph', 'rigel'], ['rigel', 'mintaka'], ['betelgeuse', 'alnitak']]
    },
    {
        id: 'zodiac_group',
        name: 'Zodiac Sector',
        description: 'The Path of the Sun. Aries (Hamal), Taurus (Aldebaran), Libra (Zuben El Jenubi).',
        astronomicalContext: 'Constellations along the ecliptic, used for ancient calendars.',
        connections: [['hamal', 'aldebaran'], ['aldebaran', 'zuben_el_jenubi']]
    }
];
