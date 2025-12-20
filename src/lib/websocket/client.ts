import { WSEvents } from './events';

type EventHandler = (data: any) => void;

export class WebSocketClient {
    private static instance: WebSocketClient;
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectInterval: number = 3000;
    private maxReconnectAttempts: number = 10;
    private reconnectAttempts: number = 0;
    private listeners: Map<string, Set<EventHandler>> = new Map();
    private token: string | null = null;
    private isConnecting: boolean = false;
    private pendingQueue: string[] = [];
    public isConnected: boolean = false;

    private constructor() {
        this.url = process.env.NEXT_PUBLIC_WS_URL || 'wss://maw3idokom-production-b94c.up.railway.app';
    }

    public static getInstance(): WebSocketClient {
        if (!WebSocketClient.instance) {
            WebSocketClient.instance = new WebSocketClient();
        }
        return WebSocketClient.instance;
    }

    public setToken(token: string) {
        this.token = token;
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.send(WSEvents.CLIENT_AUTH, { token });
        } else if (!this.isConnected) {
            this.connect();
        }
    }

    public connect() {
        if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;
        if (typeof window === 'undefined') return; // Don't connect on server side

        this.isConnecting = true;
        console.log(`🔌 [WS] Connecting to ${this.url}...`);

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('✅ [WS] Connected');
                this.isConnected = true;
                this.isConnecting = false;
                this.reconnectAttempts = 0;

                // Authenticate immediately if token exists
                if (this.token) {
                    this.send(WSEvents.CLIENT_AUTH, { token: this.token });
                }

                // Flush pending messages
                while (this.pendingQueue.length > 0) {
                    const msg = this.pendingQueue.shift();
                    if (msg) this.ws?.send(msg);
                }

                this.emit('connected', {});
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    const { event: eventName, data } = message;
                    this.emit(eventName, data);
                } catch (e) {
                    console.error('❌ [WS] Failed to parse message:', event.data);
                }
            };

            this.ws.onclose = (event) => {
                console.log('⚠️ [WS] Disconnected', event.code, event.reason);
                this.isConnected = false;
                this.isConnecting = false;
                this.emit('disconnected', {});
                this.handleReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('❌ [WS] Error:', error);
                this.isConnecting = false;
            };

        } catch (e) {
            console.error('❌ [WS] Connection failed:', e);
            this.isConnecting = false;
            this.handleReconnect();
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ [WS] Max reconnect attempts reached');
            return;
        }

        const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff max 30s
        console.log(`🔄 [WS] Reconnecting in ${timeout}ms... (Attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
        }, timeout);
    }

    public subscribe(event: string, callback: EventHandler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)?.add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.get(event)?.delete(callback);
        };
    }

    public emit(event: string, data: any) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`Error in listener for ${event}:`, e);
                }
            });
        }
    }

    public send(event: string, data: any) {
        const payload = JSON.stringify({ event, data });
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(payload);
        } else {
            this.pendingQueue.push(payload);
        }
    }

    public disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
        }
    }
}

export const webSocketClient = WebSocketClient.getInstance();
