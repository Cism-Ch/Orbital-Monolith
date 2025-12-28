import { useState, useEffect } from 'react';

export const useClock = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 100);
        return () => clearInterval(timer);
    }, []);

    return currentTime;
};
