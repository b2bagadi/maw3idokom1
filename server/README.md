# Maw3idokom WebSocket Server

This is the standalone WebSocket server for Maw3idokom that handles real-time communication.

## Deployment to Railway

### Step 1: Create New Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `maw3idokom` repository
4. Railway will detect the project

### Step 2: Configure Start Command

In Railway Project Settings:

**Root Directory:** `server`  
**Start Command:** `npm start`  
**Build Command:** `npm install`

### Step 3: Set Environment Variables

In Railway → Variables tab, add:

```
PORT=8080
WS_ORIGIN=https://maw3idokom.vercel.app
```

### Step 4: Get Your Railway URL

After deployment, Railway will provide a URL like:
```
maw3idokom-production-b94c.up.railway.app
```

### Step 5: Update Vercel Environment

Go to Vercel → Your Project → Settings → Environment Variables

Update:
```
NEXT_PUBLIC_WS_URL=wss://maw3idokom-production-b94c.up.railway.app
```

## Testing

Test the server is running:
```bash
curl https://your-railway-url.railway.app
```

Should return: `WebSocket Server Running ✅`

## Logs

View Railway logs to see:
- Connection attempts
- Authentication events  
- Broadcast messages
- Active connection count

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Port to run on (default: 8080, Railway sets this) |
| `WS_ORIGIN` | Yes | Allowed origins (comma-separated) |

## Architecture

```
Vercel (Frontend)
    ↓ WSS Connection
Railway (WebSocket Server)
    ↑ Broadcasts
Next.js API Routes
```
