'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { webSocketClient } from './client';
import { WSEvents } from './events';

interface WebSocketContextType {
    isConnected: boolean;
    subscribe: (event: string, handler: (data: any) => void) => () => void;
    send: (event: string, data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
    isConnected: false,
    subscribe: () => () => { },
    send: () => { },
});

export function useWebSocket() {
    return useContext(WebSocketContext);
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // 1. Set connection status listeners
        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);

        webSocketClient.subscribe('connected', onConnect);
        webSocketClient.subscribe('disconnected', onDisconnect);

        // 2. Connect
        webSocketClient.connect();

        return () => {
            // webSocketClient.disconnect(); // Optional: keep alive for SPA navigation?
            // Usually better to keep it open unless unmounting the whole app
        };
    }, []);

    useEffect(() => {
        if (session?.user?.id) {
            // Assume we might need to send the session ID or a token for auth
            // If your NextAuth content provides an access token, use it here.
            // For now, we'll just simulate auth or send the user ID if the server trusts it (which it shouldn't, but following current flow)
            // If we have a proper JWT token from `session`, we should use it.
            // webSocketClient.setToken(session.accessToken);

            // If we don't have a token, we at least authenticate with the user ID for channel subscription
            // This depends on how the Railway server expects auth. 
            // Based on the plan: "Handle authentication: send JWT token on connection init"

            // NOTE: Adjust this line if you have a specific token field in your session
            const token = (session as any).accessToken || (session as any).token || session.user.id;
            webSocketClient.setToken(token);
        }
    }, [session]);

    const value = {
        isConnected,
        subscribe: (event: string, handler: (data: any) => void) => {
            return webSocketClient.subscribe(event, handler);
        },
        send: (event: string, data: any) => {
            webSocketClient.send(event, data);
        }
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}
