'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Pusher from 'pusher-js';
import type { Channel } from 'pusher-js';

interface PusherContextType {
  pusher: Pusher | null;
  userChannel: Channel | null;
  isConnected: boolean;
}

const PusherContext = createContext<PusherContextType>({
  pusher: null,
  userChannel: null,
  isConnected: false
});

export function usePusher() {
  return useContext(PusherContext);
}

export function PusherProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [pusher, setPusher] = useState<Pusher | null>(null);
  const [userChannel, setUserChannel] = useState<Channel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;

    const pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

      pusherInstance.connection.bind('connected', () => {
        setIsConnected(true);
      });

      pusherInstance.connection.bind('disconnected', () => {
        setIsConnected(false);
      });

      pusherInstance.connection.bind('error', () => {
        setIsConnected(false);
      });

      const channelName = `user-${session.user.id}`;
      const channel = pusherInstance.subscribe(channelName);

      setPusher(pusherInstance);
      setUserChannel(channel);

      return () => {
        pusherInstance.unsubscribe(channelName);
        pusherInstance.disconnect();
      };
  }, [session, status]);

  return (
    <PusherContext.Provider value={{ pusher, userChannel, isConnected }}>
      {children}
    </PusherContext.Provider>
  );
}
