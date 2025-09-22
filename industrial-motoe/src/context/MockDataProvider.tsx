import React, { createContext, useContext } from 'react';
import { devices, metrics, history } from '../data/mockdata';

interface MockDataType {
  devices: { id: string; status: string }[];
  metrics: { vibration: number; temperature: number; current: number };
  history: { ts: string; dev: string; vib: number; temp: number; cur: number; risk: number }[];
}

export const MockDataContext = createContext<MockDataType | null>(null);

export const MockDataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <MockDataContext.Provider value={{
    devices,
    metrics,
    history
  } as MockDataType}>
    {children}
  </MockDataContext.Provider>
);

export const useMockData = () => {
  const ctx = useContext(MockDataContext);
  if (!ctx) throw new Error('useMockData must be used within MockDataProvider');
  return ctx;
};
