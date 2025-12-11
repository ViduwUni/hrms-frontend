import { createContext, useState } from "react";

export const UIContext = createContext();

export function UIProvider({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <UIContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </UIContext.Provider>
  );
}
