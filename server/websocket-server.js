const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;
const ALLOWED_ORIGINS = (process.env.WS_ORIGIN || 'https://maw3idokom.vercel.app').split(',');

console.log('🚀 Starting WebSocket Server...');
console.log(`📡 Port: ${PORT}`);
console.log(`🔒 Allowed Origins: ${ALLOWED_ORIGINS.join(', ')}`);

// Create HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket Server Running ✅\n');
});

// Create WebSocket server
const wss = new WebSocket.Server({
    server,
    verifyClient: (info) => {
        const origin = info.origin || info.req.headers.origin;
        const allowed = ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*');
        if (!allowed) {
            console.log(`❌ Rejected connection from: ${origin}`);
        }
        return allowed;
    }
});

// Store user connections: Map<channelId, WebSocket>
const connections = new Map();

wss.on('connection', (ws, req) => {
    const origin = req.headers.origin || 'unknown';
    console.log(`✅ New connection from: ${origin}`);

    let userId = null;
    let channels = [];

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());

            // Handle client authentication
            if (data.event === 'client:auth') {
                userId = data.data.token;
                const channelId = `user-${userId}`;
                channels.push(channelId);
                connections.set(channelId, ws);
                console.log(`🔑 User authenticated: ${userId}`);
                ws.send(JSON.stringify({
                    event: 'auth:success',
                    data: { userId, connected: true }
                }));
                return;
            }

            // Handle server-side broadcast requests
            if (data.type === 'broadcast') {
                const targetChannel = data.channel;
                const targetWs = connections.get(targetChannel);

                if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                    targetWs.send(JSON.stringify({
                        event: data.event,
                        data: data.data
                    }));
                    console.log(`📤 Broadcasted [${data.event}] to ${targetChannel}`);
                    ws.send(JSON.stringify({ status: 'sent' }));
                } else {
                    console.log(`⚠️ Target not found or offline: ${targetChannel}`);
                    ws.send(JSON.stringify({ status: 'offline' }));
                }
                return;
            }

            // Echo back for testing
            ws.send(JSON.stringify({
                event: 'echo',
                data: { received: data }
            }));

        } catch (e) {
            console.error('❌ Message parse error:', e);
            ws.send(JSON.stringify({
                event: 'error',
                data: { message: 'Invalid message format' }
            }));
        }
    });

    ws.on('close', () => {
        // Clean up all channels for this connection
        channels.forEach(channel => {
            connections.delete(channel);
        });
        console.log(`👋 Client disconnected${userId ? ` (${userId})` : ''}`);
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ WebSocket Server running on port ${PORT}`);
    console.log(`📊 Active connections: ${connections.size}`);
});

// Log stats every 30 seconds
setInterval(() => {
    console.log(`📊 Active connections: ${connections.size}`);
}, 30000);
