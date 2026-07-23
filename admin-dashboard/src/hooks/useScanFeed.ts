import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ScanFeedEvent {
  transactionId: string;
  workerName: string;
  clockNumber: string;
  department: string;
  shift: string;
  couponType: string;
  businessDate: string;
  time: string;
  status: 'SUCCESS' | 'REJECTED';
  remaining: { breakfastTea: number; meal: number; tea: number };
  photoUrl: string | null;
}

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ?? 'http://localhost:3000';

export function useScanFeed(maxItems = 100) {
  const [events, setEvents] = useState<ScanFeedEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(`${WS_BASE_URL}/dashboard`, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('scan:new', (event: ScanFeedEvent) => {
      setEvents((prev) => [event, ...prev].slice(0, maxItems));
    });

    return () => {
      socket.disconnect();
    };
  }, [maxItems]);

  return { events, connected };
}
