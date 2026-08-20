'use client';

import React, { createContext, useContext, useState } from 'react';

interface AppContextType {
  lang: string;
  setLang: (lang: string) => void;
}

const AppContext = createContext<AppContextType>({ lang: 'en', setLang: () => {} });

export function useApp() {
  return useContext(AppContext);
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState('en');
  return (
    <AppContext.Provider value={{ lang, setLang }}>
      {children}
    </AppContext.Provider>
  );
}
