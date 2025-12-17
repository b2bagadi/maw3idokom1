'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false
});

export function useWebSocket() {
  return useContext(WebSocketContext);
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;

    const socketInstance = io({
      path: '/api/socket',
      auth: {
        userId: session.user.id,
        role: session.user.role
      }
    });

    socketInstance.on('connect', () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [session, status]);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}
