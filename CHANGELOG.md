# Changelog — Orbital Monolith

Toutes les modifications majeures apportées au projet **Orbital Monolith** sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au sémantisme de versioning [Semantic Versioning](https://semver.org/lang/fr/).

## [3.6.1] - 2026-07-20

### 🎛️ Panneau de Contrôle Scène Repliable & Documentation Anglaise
- **Repliement Dynamique du Panneau `SceneControlPanel` (`Solar Control` / `Sky Control`)** :
  - Ajout d'un bouton de repliement/dépliement (`ChevronDown` / `ChevronUp`) dans l'en-tête du composant [SceneControlPanel.tsx](file:///c:/Users/hanok/Dev/Personal-Project/Orbital-Monolith/src/components/ui/SceneControlPanel.tsx).
  - Intégration de `AnimatePresence` pour une animation de repliement verticale fluide de la zone des contrôles (Inclination, Rotation, Zoom, Reset View).
  - Permet à l'utilisateur de passer instantanément en affichage 3D plein écran épuré sans obstruction visuelle.
- **Captures d'Écran Réelles de l'Application** :
  - Suppression de l'ancienne image d'en-tête statique et intégration dans le README de 4 véritables captures d'écran de l'application (Landing, Sky Map, Gaia Archive, System Calibration) générées automatiquement depuis le serveur local.
- **Traduction & Polissage de la Documentation (`README.md`)** :
  - Traduction intégrale en anglais du fichier `README.md` v3.6.
  - Enrichissement des sections d'architecture, du télémètre laser 3D (`AstrometricalBridge`) et de la sidebar escamotable.

## [3.6.0] - 2026-07-19

### 🖱️ Sidebar Escamotable & Parité UI/UX Carte Stellaire (Sky Map)
- **Sidebar Escamotable sur Bord d'Écran (*Auto-Hide & Edge Hover Reveal*)** :
  - Transformation de la sidebar de navigation (`aside`) en un overlay escamotable (`fixed top-0 left-0 bottom-0 z-[100]`).
  - Ajout d'une zone de détection et d'une poignée lumineuse néon interactive sur le bord gauche de l'écran.
  - Glissement fluide (*slide-in* au survol du bord gauche / *slide-out* lorsque le curseur s'éloigne).
  - Élimination de la réservation statique de 72px pour libérer 100% de la largeur de l'écran au canvas WebGL 3D.
  - Réalignement des overlays HUD (Header, Boîte à outils, `SceneControlPanel`) vers `left-6`.
- **Refonte UX du Panneau de Notifications Autonome (`System_Alerts`)** :
  - Extraction du panneau de notifications hors du conteneur HTML de la sidebar (`aside`).
  - Le panneau s'ouvre désormais sous forme d'overlay flottant indépendant (`fixed left-20 bottom-12 z-[150]`) à côté de la sidebar.
  - L'ouverture et la consultation des alertes ne sont plus interrompues lors de la fermeture automatique de la sidebar escamotable.
- **Refonte UX de la Page Paramètres (`Core_Settings`) & Contrôles Typographie / Visual Core** :
  - **Gestion Spécifique des Tooltips (`Tooltip Font Size`)** : Ajout d'un slider (7px à 14px) avec presets (*Small 7px*, *Standard 9px*, *Large 12px*), conversion en points (`pt`) et Widget d'aperçu d'un tooltip système en direct.
  - **Fonctionnalité complète des réglages `Visual Core`** :
    - `Interface Opacity` (20% à 100%) : Met à jour la variable CSS `--basalt-opacity` modifiant en direct l'opacité du verre dépoli (*glassmorphism*) sur tous les panneaux.
    - `Ambient Depth Intensity` (0% à 100%) : Ajuste l'intensité de la profondeur et du vignettage via `--ambient-occlusion`.
    - `Hyper-Spatial Rendering` (Toggle ON/OFF) : Active ou désactive le grain cinématographique et les lignes CRT (`data-hyperspatial`).
  - **Correctif du Défilement / Scrollability (`overflow-y-auto`)** : Correction sur le conteneur principal `<main>` dans `layout.tsx` (`h-full overflow-y-auto overflow-x-hidden`) et sur la page de paramètres pour défiler naturellement lorsque le contenu dépasse la hauteur d'écran.
  - **Moteur de Diagnostic Système Réel (`Advanced Diagnostics Engine`)** : Remplacement des données factices par un calcul réel et dynamique en temps réel des métriques système : FPS mesurés par boucle `requestAnimationFrame`, mémoire Heap JS utilisée via `performance.memory`, modèle et pilote d'accélération matériel GPU réel via WebGL `WEBGL_debug_renderer_info`, résolution & DPR d'affichage, nombre réel d'objets célestes chargés en mémoire (264 nœuds) et taille exacte consommée dans `localStorage`.
  - **Action de Re-synchronisation globale (`Re-Sync Systems`)** : Déclenche la recalibration du canvas WebGL 3D, réapplique l'ensemble des variables CSS racine et rafraîchit la matrice matérielle.
  - **Correctif d'Affichage de la Carte 3D / Prévention de la Perte de Contexte WebGL (`WEBGL_CONTEXT_LOST`)** : Ré-utilisation sécurisée du renderer Three.js existant de `useUniverseEngine()` pour la détection GPU au lieu d'allouer un canvas temporaire, et ajout de gestionnaires d'événements `webglcontextlost` / `webglcontextrestored` pour restaurer la carte stellaire 3D instantanément.
  - Intégration sur la carte stellaire de la Fiche d'Analyse Astre/Étoile, du statut *Live Hover Preview* / *Locked Target*, du Pont Astrométrique avec télémètre laser 3D, du déclencheur de Scan Complet (`FocusView`) et du flux de télémétrie en direct.
  - Adaptation automatique du formatage des distances (unités UA/km pour les planètes, années-lumière `al` pour les étoiles) et synchronisation des couleurs d'accentuation dynamique (`useAccentColors`).

---

## [3.5.1] - 2026-07-19

### 🎯 Correctif d'Affichage Hologramme 3D (`CelestialBody3D.tsx`)
- **Élimination de la Duplication Verticale du Canvas WebGL** : Vidage systématique du conteneur DOM (`container.innerHTML = ''`) avant l'instanciation de chaque nouveau canvas WebGL Three.js, empêchant la superposition verticale de multiples sphères lors des re-rendus.
- **Centrage Holographique Parfait (`showTitle={false}`)** : Ajout du prop `showTitle?: boolean` sur `CelestialBody3D.tsx` et désactivation du titre secondaire dans `FocusView.tsx`. L'hologramme 3D est désormais parfaitement centré au milieu du cadre d'analyse 280px × 320px sans aucun décalage vers le haut.

---

## [3.5.0] - 2026-07-19

### 🛰️ Correctif Modale Focus & Télémétrie Astrophysique Authentique
- **Déblocage de l'Interactivité Plein Écran (`FocusView.tsx`)** : Ajout de `pointer-events-auto` sur l'enveloppe globale de `FocusView.tsx`. Les clics sur le bouton de fermeture `X`, le fond flouté (backdrop) et les boutons d'action sont désormais 100% opérationnels.
- **Support de la Touche `Échap` & Clic Backdrop** : Fermeture instantanée de la vue Focus lors d'un clic sur la croix `X`, sur l'arrière-plan ou à l'appui sur la touche `Échap`.
- **Refonte de la Télémétrie Astrophysique Réelle (`useTelemetry.ts`)** : Remplacement des données fictives aléatoires par un générateur de télémétrie astrophysique authentique, dérivant en direct les valeurs réelles de l'astre inspecté (Masse, Gravité de surface, Température effective, Vitesse d'échappement, Profil atmosphérique, Magnitude apparente, Identifiant Gaia DR3).
- **Synchronisation Globale** : Transmission du `body` réactif à `<TelemetryStream body={displayedBody} />` dans le panneau latéral droit et la modale Focus.

---

## [3.4.2] - 2026-07-19

### 🚀 Correctif Majeur d'Interaction 3D (Capture des Événements `window`)
- **Déblocage de l'Empilement DOM CSS (`window.addEventListener`)** : Migration des écouteurs `mousemove` et `click` du canvas WebGL (`domElement` à `z-0`) vers la fenêtre globale (`window`). L'enveloppe `<main>` (`z-10`) ne bloque désormais plus aucun événement de survol ni de clic destiné à la scène 3D.
- **Filtre Sécurisé d'Éléments UI (`closest('.pointer-events-auto')`)** : Exclusion intelligente des survols et des clics lorsque l'utilisateur interagit avec les panneaux UI (sidebar, header, `SceneControlPanel`, fiche d'analyse).
- **Conservation des Hitboxes Élargies (250u)** : La combinaison du listener `window` et des cibles de détection 250u garantit une réactivité instantanée et sans échec du survol et de la sélection sur tout l'écran.

---

## [3.4.1] - 2026-07-19

### 🎯 Correctif Critique : Activation du Survol Réactif & Hitboxes 3D Généreuses (250u)
- **Résolution du Blocage Polaris (État `isLocked` par défaut)** : Passage de `isLocked` de `true` à `false` par défaut dans `DashboardContext.tsx`. La fiche d'analyse réagit désormais immédiatement au survol de n'importe quel astre dès l'arrivée sur l'application.
- **Sphères de Détection Invisibles (`Hit Target 250 units`)** :
  - **`SkyMapView.tsx`** : Ajout d'une sphère invisible de rayon **250 unités** autour de chaque étoile (à R=3000u), transformant la petite cible de 11px en une zone cliquable de **70-100px** sur l'écran.
  - **`SolarSystemView.tsx`** : Ajout d'une sphère invisible de rayon **50-100 unités** sur le Soleil (`sunHitMesh`) et les planètes (`pHitMesh`).
- **Verrouillage au Clic Totalement Fonctionnel** : Un clic sur une étoile ou planète verrouille la fiche (`🔒 LOCKED TARGET`), et le survol réactif reprend dès un clic sur *"Unlock Live Hover"*.

---

## [3.4.0] - 2026-07-18

### 🔒 Survol Réactif & Verrouillage de la Sélection des Astres
- **Mode Survol Réactif (*Live Hover Preview*)** : Le simple déplacement de la souris sur un corps céleste met à jour instantanément la fiche d'analyse du panneau droit avec les données en direct de l'astre survolé.
- **Verrouillage par Clic (*Selection Locking*)** : Cliquer sur un astre verrouille l'affichage sur cet astre (badge **🔒 LOCKED TARGET**). La fiche reste fixe et insensible au déplacement involontaire de la souris. Un bouton interactif *"Unlock Live Hover"* permet de libérer le verrouillage.
- **Élargissement des Zones de Détection 3D (*Raycasting Expansion*)** : Assignation de `userData.body` aux lueurs et atmosphères des planètes (`pGlow`, `sunGlow`, `satRing`) et des étoiles (`glow`, `group`), rendant la détection de clic 100% précise et sans échec.

---

## [3.3.0] - 2026-07-18

### 🏛️ Refonte de l'Architecture Z-Index & Désensablement des Contrôles 3D
- **Création du Composant Autonome `SceneControlPanel` (`z-40`)** : Extraction complète des contrôles de scène 3D (Grille `G`, Voie Lactée `M`, Constellations `Waypoints`, Caméra Libre `RotateCw`, Sliders Inclinaison/Rotation/Zoom, et *Reset View*) hors du viewport `z-0` vers un composant UI autonome monté dans le layout principal à `z-40` (`pointer-events-auto`).
- **Résolution du Conflit de Stacking Context CSS** : Élimination définitive du piège CSS où l'enveloppe `<main>` (`z-10`) bloquait l'accès aux boutons rendus dans `#universe-viewport` (`z-0`).
- **Centralisation de l'État `showConstellations`** : Intégration du contrôle visuel des constellations dans `DashboardContext` pour un partage réactif à travers l'ensemble de l'interface.
- **Épuration des Composants 3D** : `SolarSystemView.tsx` et `SkyMapView.tsx` sont désormais des composants 3D purs sans surcouche HTML redondante.

---

## [3.2.0] - 2026-07-18

### 🎯 Correction des Boutons & Repositionnement des Contrôles UI
- **Résolution du Chevauchement 3D Controls Overlap** : Repositionnement de l'overlay de contrôles 3D (Grille `G`, Voie Lactée `M`, Caméra Libre, Sliders Zoom/Inclinaison, Reset View) du côté **gauche** (`left-[88px] bottom-24`). Élimination à 100% du chevauchement avec le panneau latéral droit (`aside w-[400px]`), rendant tous les boutons 3D immédiatement réactifs et cliquables.
- **Boutons Sidebar Actifs** :
  - **Logo `Sparkles`** : Converti en lien actif vers la page d'accueil (`/`).
  - **Bouton `Activity`** : Connecté pour la navigation directe vers Sector Control / Télémétrie en direct.
  - **Bouton `Bell`** : Ajout d'une modale/popover rétractable des alerte système (*System Alerts*).
- **Diagnostics Systèmes Interactifs** : Implémentation du handler `handleResync` sur le bouton *"Re-Sync Systems"* des paramètres (`/settings`) avec spinner d'étalonnage, retour visuel vert de confirmation et mise à jour de la date de calibration.

---

## [3.1.0] - 2026-07-18

### ⚡ Optimisation de l'User Flow & Navigation Inter-Vues
- **Navigation Intelligente depuis la Recherche Header** : Sélectionner un corps céleste depuis les pages d'archives (`/archive`) ou de paramètres (`/settings`) redirige automatiquement vers le dashboard 3D principal (`/dashboard`) pour une visualisation immédiate.
- **Panneau de Télémétrie Rétractable** : Ajout d'un toggle interactif permettant de réduire ou déplier manuellement le flux `Live_Telemetry` sur le panneau droit afin de libérer le champ visuel 3D.
- **Avance Rapide sur l'Onboarding** : Ajout d'un bouton *"Skip Sequence // Fast Forward"* sur la page d'onboarding (`/onboarding`) pour accéder directement au tableau de bord sans attendre la séquence de boot.
- **Accessibilité Clavier Modale `FocusView`** : Ajout de l'écouteur d'événement `Escape` pour la fermeture instantanée de la vue d'inspection approfondie.
- **Amélioration des Contrastes & Lisibilité UI** : Renforcement des masques floutés (*backdrop-blur-3xl*) et des fondus sombres sur les conteneurs des pages d'archives et de paramètres.

---

## [3.0.0] - 2026-07-18

### 🏗️ Refondation Architecturale (SPA & Viewport 3D Persistant)
- **Singleton WebGL Context** (`src/lib/UniverseEngineContext.tsx`) : 
  - Centralisation du moteur 3D (`WebGLRenderer`, `PerspectiveCamera`, `Scene`) au niveau du layout principal.
  - Suppression totale du remontage/démontage du canvas WebGL lors des navigations Next.js.
  - Résolution définitive du bug d'objets célestes invisibles : passage de l'initialisation des meshes de `useMemo` à `useEffect` (garantissant que le renderer est prêt avant la population de la scène).
  - Gestion stricte de la mémoire GPU (disposal systématique des géométries et matériaux au démontage).

### 🌌 Vues 3D & Navigation Inter-Vues
- **Démarrage sur Carte Stellaire (`SKY`)** : Le dashboard s'ouvre désormais par défaut sur la carte stellaire centrée sur l'Étoile Polaire (*Polaris*).
- **Boîte à Outils Flottante (`Toolbox`)** :
  - Ajout d'une boîte à outils rétractable située dans l'angle inférieur gauche (`z-60`).
  - Auto-dépliante au survol/focus, permettant la bascule instantanée entre la vue Système Solaire (**SOLAR**) et la Carte Stellaire (**SKY**) sans rechargement de page ni navigation d'URL.
  - Intégration du mode de mesure de distances astronomiques en direct.
- **Pages Overlay Transparents** :
  - Transposition des routes (`/dashboard`, `/dashboard/map`) sous forme d'overlays semi-transparents avec gestion fine des `pointer-events` (clic à travers les zones vides vers le moteur 3D).

### 🪐 Données Astronomiques Réelles & Types Enrichis
- **Données NASA JPL / UAI / Gaia DR3** (`src/constants/index.ts`) :
  - Refonte globale des constantes avec des valeurs réelles vérifiées.
  - Propriétés physiques complètes : masse, rayon équatorial, température de surface, gravité, période orbitale, magnitude apparente/absolue, albédo, composition atmosphérique, nombre de lunes.
  - Ajout d'anecdotes scientifiques (`funFact`) et références officielles pour chaque corps céleste.
- **Typage Strict & Documenté** (`src/types/index.ts`) :
  - Interfaces enrichies (`PhysicalProperties`, `CelestialBody`, `Constellation`, `ViewMode`, `DistanceMeasurement`).

### 🎬 Landing Page Cinématique
- **Redesign complet de la page d'accueil (`src/app/page.tsx`)** :
  - Background starfield en Canvas 2D réactif et performant.
  - Séquence de démarrage type terminal cosmique (*boot sequence*).
  - Titre interactif avec effet visuel *glitch*.
  - Panneau de métriques (astéroïdes, étoiles, constellations, sources).

### 🧹 Hygiène du Code & Compilation
- Suppression du code mort et des hooks dépréciés (`useUniverseEngine.ts` local, `UniverseContainer.tsx`).
- Suppression des `console.log` de débogage.
- Compilation TypeScript stricte sans avertissements (`tsc --noEmit` clean).
- Validation du build de production Next.js 16 (`npx next build` 100% valide).

---

## [2.5.0] - 2026-07-05

### Modifié
- Premiers essais d'optimisation des performances des composants R3F.
- Mise en place du layout initial et du système de thème Basalt.

---

## [1.0.0] - 2026-06-15

### Ajouté
- Version initiale du projet Orbital Monolith (Explorateur du Système Solaire et Carte Stellaire basique).
