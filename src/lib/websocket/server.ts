import WebSocket from 'ws';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://maw3idokom-production-b94c.up.railway.app';

interface BroadcastData {
    channel: string;
    event: string;
    data: any;
}

export async function broadcastEvent(channel: string, event: string, data: any) {
    return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(WS_URL);

        const payload = JSON.stringify({
            type: 'broadcast', // Assumed server protocol
            channel,
            event,
            data
        });

        ws.on('open', () => {
            console.log(`[WS-Server] Connected to ${WS_URL} for broadcasting`);
            // Optional: Authentication if required by server
            // ws.send(JSON.stringify({ type: 'auth', token: process.env.WS_SECRET }));

            ws.send(payload, (err) => {
                if (err) {
                    console.error('[WS-Server] Send error:', err);
                    reject(err);
                } else {
                    console.log(`[WS-Server] Broadcasted to ${channel}: ${event}`);
                    ws.close();
                    resolve();
                }
            });
        });

        ws.on('error', (err) => {
            console.error('[WS-Server] Connection error:', err);
            reject(err);
        });

        // Timeout safety
        setTimeout(() => {
            if (ws.readyState !== WebSocket.CLOSED) {
                ws.terminate();
                reject(new Error('Broadcast timeout'));
            }
        }, 5000);
    });
}
