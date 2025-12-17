'use client';

import React, { createContext, useContext, useState } from 'react';

interface HeaderContextType {
  headerHeight: number; // Current header height (48px or 84px)
  isCollapsed: boolean;
}

const defaultContext: HeaderContextType = {
  headerHeight: 84,
  isCollapsed: false,
};

const HeaderContext = createContext<HeaderContextType>(defaultContext);

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [headerHeight, setHeaderHeight] = useState(84);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const updateHeaderState = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    setHeaderHeight(collapsed ? 48 : 84);
  };

  return (
    <HeaderContext.Provider value={{ headerHeight, isCollapsed }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    return defaultContext;
  }
  return context;
}

export { HeaderContext };
