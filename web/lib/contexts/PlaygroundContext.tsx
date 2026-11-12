'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Playground } from '../types';
import { api } from '../api';

interface PlaygroundContextType {
  playground: Playground | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const PlaygroundContext = createContext<PlaygroundContextType | undefined>(undefined);

export function PlaygroundProvider({ children }: { children: ReactNode }) {
  const [playground, setPlayground] = useState<Playground | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlayground = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCurrentPlayground();
      setPlayground(data);
    } catch (err) {
      console.error('Failed to load playground:', err);
      setError(err instanceof Error ? err.message : 'Failed to load playground');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayground();
  }, []);

  return (
    <PlaygroundContext.Provider
      value={{
        playground,
        loading,
        error,
        reload: loadPlayground,
      }}
    >
      {children}
    </PlaygroundContext.Provider>
  );
}

export function usePlayground() {
  const context = useContext(PlaygroundContext);
  if (context === undefined) {
    throw new Error('usePlayground must be used within a PlaygroundProvider');
  }
  return context;
}

