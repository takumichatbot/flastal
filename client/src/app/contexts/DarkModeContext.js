'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const DarkModeContext = createContext({ dark: false, toggle: () => {} });

export function DarkModeProvider({ children }) {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('flastal_dark');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initial = saved !== null ? saved === 'true' : prefersDark;
        setDark(initial);
        document.documentElement.classList.toggle('dark', initial);
    }, []);

    const toggle = () => {
        setDark(prev => {
            const next = !prev;
            document.documentElement.classList.toggle('dark', next);
            localStorage.setItem('flastal_dark', String(next));
            return next;
        });
    };

    return (
        <DarkModeContext.Provider value={{ dark, toggle }}>
            {children}
        </DarkModeContext.Provider>
    );
}

export const useDarkMode = () => useContext(DarkModeContext);
