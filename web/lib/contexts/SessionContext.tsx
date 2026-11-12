'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Session, Instance } from '../types';
import { api } from '../api';

interface SessionContextType {
  session: Session | null;
  instances: Instance[];
  selectedInstance: Instance | null;
  loading: boolean;
  error: string | null;
  isAlive: boolean;
  ttl: string;
  setSession: (session: Session) => void;
  setInstances: (instances: Instance[]) => void;
  addInstance: (instance: Instance) => void;
  updateInstance: (instanceName: string, updates: Partial<Instance>) => void;
  removeInstance: (instanceName: string) => void;
  selectInstance: (instance: Instance | null) => void;
  closeSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ 
  children,
  sessionId 
}: { 
  children: ReactNode;
  sessionId?: string;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAlive, setIsAlive] = useState(true);
  const [ttl, setTtl] = useState('--:--:--');

  // Calculate TTL countdown
  useEffect(() => {
    if (!session?.expires_at) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiresAt = new Date(session.expires_at).getTime();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setIsAlive(false);
        setTtl('00:00:00');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / 1000 / 60 / 60);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTtl(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.expires_at]);

  const addInstance = useCallback((instance: Instance) => {
    setInstances((prev) => {
      const exists = prev.find((i) => i.name === instance.name);
      if (exists) return prev;
      return [...prev, instance];
    });
  }, []);

  const updateInstance = useCallback((instanceName: string, updates: Partial<Instance>) => {
    setInstances((prev) =>
      prev.map((inst) =>
        inst.name === instanceName ? { ...inst, ...updates } : inst
      )
    );
  }, []);

  const removeInstance = useCallback((instanceName: string) => {
    setInstances((prev) => prev.filter((inst) => inst.name !== instanceName));
    setSelectedInstance((current) =>
      current?.name === instanceName ? null : current
    );
  }, []);

  const selectInstance = useCallback((instance: Instance | null) => {
    setSelectedInstance(instance);
  }, []);

  const closeSession = useCallback(async () => {
    if (!session?.id) return;
    
    try {
      await api.closeSession(session.id);
      setIsAlive(false);
    } catch (err) {
      console.error('Failed to close session:', err);
      setError(err instanceof Error ? err.message : 'Failed to close session');
    }
  }, [session?.id]);

  return (
    <SessionContext.Provider
      value={{
        session,
        instances,
        selectedInstance,
        loading,
        error,
        isAlive,
        ttl,
        setSession,
        setInstances,
        addInstance,
        updateInstance,
        removeInstance,
        selectInstance,
        closeSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

