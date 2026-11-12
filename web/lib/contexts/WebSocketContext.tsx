'use client';

import React, { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { wsService, WebSocketService } from '../websocket';

interface WebSocketContextType {
  ws: WebSocketService;
  connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({
  children,
  sessionId,
}: {
  children: ReactNode;
  sessionId?: string;
}) {
  const [connected, setConnected] = React.useState(false);

  useEffect(() => {
    if (!sessionId) return;

    // Connect to WebSocket
    wsService.connect(sessionId);

    // Listen for connection status
    const onConnected = () => setConnected(true);
    const onDisconnected = () => setConnected(false);

    wsService.on('connected', onConnected);
    wsService.on('disconnected', onDisconnected);

    return () => {
      wsService.off('connected', onConnected);
      wsService.off('disconnected', onDisconnected);
      wsService.disconnect();
    };
  }, [sessionId]);

  return (
    <WebSocketContext.Provider value={{ ws: wsService, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

