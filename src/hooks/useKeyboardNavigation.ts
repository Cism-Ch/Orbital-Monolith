"use client";

import { useEffect } from 'react';
import { useDashboard } from '@/lib/DashboardContext';
import { SOLAR_SYSTEM, STARS } from '@/constants';

export function useKeyboardNavigation() {
    const {
        view,
        setView,
        selectedBody,
        setSelectedBody,
        isFocusMode,
        setIsFocusMode,
        showGrid,
        setShowGrid,
        showMilkyWay,
        setShowMilkyWay,
        perspectiveMode,
        setPerspectiveMode
    } = useDashboard();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Do not trigger shortcuts when typing in search fields or inputs
            const activeEl = document.activeElement;
            const isTyping = activeEl && (
                activeEl.tagName === 'INPUT' ||
                activeEl.tagName === 'TEXTAREA' ||
                activeEl.getAttribute('contenteditable') === 'true'
            );
            if (isTyping) return;

            const activeList = view === 'SOLAR' ? SOLAR_SYSTEM : STARS;
            const currentIndex = activeList.findIndex(b => b.id === selectedBody.id);

            switch (e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    if (activeList.length > 0) {
                        const nextIdx = currentIndex === -1 ? 0 : (currentIndex + 1) % activeList.length;
                        setSelectedBody(activeList[nextIdx]);
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (activeList.length > 0) {
                        const prevIdx = currentIndex === -1 ? activeList.length - 1 : (currentIndex - 1 + activeList.length) % activeList.length;
                        setSelectedBody(activeList[prevIdx]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    setIsFocusMode(false);
                    break;
                case 'v':
                case 'V':
                    e.preventDefault();
                    setView(view === 'SOLAR' ? 'SKY' : 'SOLAR');
                    break;
                case 'g':
                case 'G':
                    e.preventDefault();
                    setShowGrid(!showGrid);
                    break;
                case 'm':
                case 'M':
                    e.preventDefault();
                    setShowMilkyWay(!showMilkyWay);
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    setPerspectiveMode(perspectiveMode === 'heliocentric' ? 'free' : 'heliocentric');
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        view,
        setView,
        selectedBody,
        setSelectedBody,
        isFocusMode,
        setIsFocusMode,
        showGrid,
        setShowGrid,
        showMilkyWay,
        setShowMilkyWay,
        perspectiveMode,
        setPerspectiveMode
    ]);
}
