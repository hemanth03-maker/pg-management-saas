import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SettingsContextType {
  pgName: string;
  setPgName: (name: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [pgName, setPgNameState] = useState(() => localStorage.getItem("pg_name") || "My PG");

  const setPgName = (name: string) => {
    setPgNameState(name);
    localStorage.setItem("pg_name", name);
  };

  return (
    <SettingsContext.Provider value={{ pgName, setPgName }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
};
