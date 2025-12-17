# Real-Time Matching System - Setup & Usage Guide

## 🚀 What's Been Implemented

A complete Uber-like real-time matching system with:
- **Client Quick Find Button**: Floating action button for instant service discovery
- **Business Popup Notifications**: Real-time popup that appears on ANY page when a matching request comes in
- **WebSocket Integration**: Custom Socket.io server for real-time bidirectional communication
- **Race Condition Protection**: First business to accept gets the booking
- **Persistent Popups**: Survive page navigation using localStorage

---

## ⚙️ Installation & Setup

### 1. Stop Current Dev Server
Press `Ctrl+C` in your terminal to stop the running Next.js server.

### 2. Install Dependencies
```bash
npm install
```

This will install:
- `socket.io` (v4.8.1) - Server-side WebSocket library
- `socket.io-client` (v4.8.1) - Client-side WebSocket library  
- `express` (v4.21.2) - HTTP server wrapper

### 3. Run Database Migration
```bash
npx prisma migrate deploy
```

This creates 4 new tables:
- `ClientQuickfindPrefs` - Client search preferences
- `BusinessApproval` - Pre-approved services by businesses
- `BookingRequest` - Real-time booking requests
- `BusinessRequestView` - Tracking business responses

### 4. Start the Custom Server
```bash
npm run dev
```

This now runs `node server.mjs` instead of `next dev`, which:
- Starts Next.js app handler
- Attaches Socket.io WebSocket server
- Listens on `http://localhost:3000`
- WebSocket endpoint: `ws://localhost:3000/api/socket`

---

## 📁 Files Created

### Server Infrastructure
- **`server.mjs`** - Custom Node.js server with Socket.io integration
- **`src/lib/websocket/client.tsx`** - WebSocket provider and React hooks

### Client Components
- **`src/components/quickfind/QuickFindButton.tsx`** - Floating action button (purple gradient)
- **`src/components/quickfind/QuickFindModal.tsx`** - Search modal with filters

### Business Components
- **`src/components/booking/RequestPopup.tsx`** - Full-screen popup with 2-minute timer

### Database Schema
- Updated `prisma/schema.prisma` with 4 new models

---

## 🎯 How It Works

### **For Clients (role: CLIENT)**

1. **Login as a client** (register via `/register`)
2. **Quick Find Button appears** (bottom-right corner) - only when logged in
3. **Click button** → Opens modal with filters:
   - Category selection
   - Max price slider
   - Datetime picker
   - Min rating filter
4. **Click "Find Available"** → Searches businesses with pre-approvals matching criteria
5. **Click "Request Booking"** on a business → Sends real-time request to ALL matching businesses
6. **Wait for acceptance** → First business to accept wins (others dismissed)

### **For Businesses (role: BUSINESS)**

1. **Login as a business** (register via `/business/register`)
2. **Popup appears instantly** when client sends matching request (any page you're on)
3. **2-minute countdown timer** - must respond or auto-reject
4. **Click "Accept"** → Creates confirmed booking, notifies client, dismisses all other business popups
5. **Click "Reject"** → Tracks rejection, removes popup
6. **Popup persists across navigation** - survives page reloads via localStorage

---

## 🔧 Testing the System

### Step 1: Create Business Approvals
Businesses need to pre-approve categories/prices. Run this in Prisma Studio or via SQL:

```sql
-- Insert pre-approval for a test business
INSERT INTO "BusinessApproval" (id, "businessId", "categoryId", "approvedPrice", "approvedDurationMinutes", "isActive", "createdAt")
VALUES (
  'test-approval-1',
  'YOUR_BUSINESS_ID_HERE',  -- Get from businesses table
  'YOUR_CATEGORY_ID_HERE',   -- Get from categories table (e.g., "Salon")
  5000,                      -- $50.00 (stored in cents)
  60,                        -- 60 minutes
  true,
  NOW()
);
```

### Step 2: Test Client Flow
1. Login as CLIENT
2. Click purple lightning button (bottom-right)
3. Select category you added approval for
4. Set max price ≥ $50
5. Click "Find Available" - should see your test business
6. Click "Request Booking"

### Step 3: Test Business Flow
1. In another browser/incognito, login as the BUSINESS you added approval for
2. **Popup should appear immediately** with client request
3. Timer counts down from 2:00
4. Click "Accept" → Client receives notification, popup disappears

### Step 4: Test Race Condition
1. Create multiple business approvals for same category
2. Send one client request
3. **All businesses see popup simultaneously**
4. First business to click "Accept" wins
5. All other popups instantly disappear

---

## 🎨 UI/UX Features

### Quick Find Button
- **Gradient**: Purple-to-pink (`from-purple-600 to-pink-600`)
- **Animation**: Pulsing glow effect (`animate-pulse-glow`)
- **Position**: Fixed bottom-right, `z-index: 50`
- **Visibility**: Only shows for logged-in CLIENTS when WebSocket connected

### Request Popup
- **Z-Index**: `9999` (highest layer, appears over everything)
- **Backdrop**: Black with blur (`bg-black/60 backdrop-blur-sm`)
- **Timer**: Circular progress bar + countdown text
- **Animations**: Fade-in + scale-in on appear
- **Persistence**: Stored in `localStorage` as `pendingRequest`
- **Browser Notification**: If permission granted, shows native notification

### Modal Design
- **Skeleton Loaders**: Shows 4 shimmer cards while searching
- **Business Cards**: Gradient backgrounds, rating stars, approved price prominently displayed
- **Responsive**: Grid layout (2 cols desktop, 1 col mobile)

---

## 🔐 Security Considerations

### Authentication Check
All WebSocket connections require `userId` and `role` in handshake auth:
```typescript
socket.handshake.auth = {
  userId: session.user.id,
  role: session.user.role
}
```

### Room-Based Isolation
- Clients join: `client:{userId}`
- Businesses join: `business:{userId}`
- Only relevant parties receive notifications

### Race Condition Protection
Uses Prisma's `updateMany` with `where: { status: 'PENDING' }` to ensure atomicity:
```typescript
const updated = await prisma.bookingRequest.updateMany({
  where: { id: requestId, status: 'PENDING' },
  data: { status: 'ACCEPTED', acceptedBy: businessId }
});

if (updated.count === 0) {
  // Another business already accepted
  return error;
}
```

---

## 📊 Database Schema Details

### ClientQuickfindPrefs
Stores client's search history/preferences for quick repeat searches:
```prisma
model ClientQuickfindPrefs {
  id           String   @id @default(cuid())
  clientId     String
  categoryId   String
  maxPrice     Int      // in cents
  preferredTime DateTime?
  radiusKm     Int      @default(25)
  minRating    Float    @default(3.0)
}
```

### BusinessApproval
Pre-approved services businesses are willing to accept:
```prisma
model BusinessApproval {
  id                    String   @id @default(cuid())
  businessId            String
  categoryId            String
  approvedPrice         Int      // in cents
  approvedDurationMinutes Int
  isActive              Boolean  @default(true)
}
```

### BookingRequest
Real-time requests sent by clients:
```prisma
model BookingRequest {
  id             String    @id @default(cuid())
  clientId       String
  categoryId     String
  offeredPrice   Int       // in cents
  requestedTime  DateTime
  status         String    @default("PENDING")  // PENDING, ACCEPTED, REJECTED, EXPIRED
  acceptedBy     String?   // businessId who accepted
  expiresAt      DateTime  // 2 minutes from creation
}
```

### BusinessRequestView
Tracks which businesses saw/responded to each request:
```prisma
model BusinessRequestView {
  id        String   @id @default(cuid())
  businessId String
  requestId  String
  status     String   @default("PENDING")  // PENDING, ACCEPTED, REJECTED
  viewedAt   DateTime @default(now())
  
  @@unique([businessId, requestId])
}
```

---

## 🚨 Troubleshooting

### WebSocket Not Connecting
1. Check browser console for `[WebSocket] Connected` message
2. Verify custom server is running (`node server.mjs`)
3. Check if auth session exists (`useSession` returns authenticated user)

### Button Not Appearing
- Must be logged in as CLIENT role
- WebSocket must be connected (`isConnected === true`)
- Check `session.user.role === 'CLIENT'`

### Popup Not Appearing for Business
- Must be logged in as BUSINESS role
- Business must have active approval for that category
- Check browser console for `new_request` event
- Check localStorage for `pendingRequest` key

### Race Condition Not Working
- Multiple businesses must have approvals for same category
- Check database logs for `updateMany` execution
- Verify `status` column is being checked in WHERE clause

### Prisma Client Issues
If you see "Query engine locked" errors:
```bash
# Stop all Node processes
# Delete node_modules/.prisma
# Regenerate
npx prisma generate
```

---

## 🎓 Advanced Features (Not Yet Implemented)

Ideas for future enhancement:

### For Clients
- [ ] Save favorite businesses for priority matching
- [ ] Price negotiation slider (counteroffer)
- [ ] Recurring requests ("I need this every week")
- [ ] Instant chat after acceptance
- [ ] Push notifications when page closed

### For Businesses
- [ ] Auto-accept rules (e.g., "Auto-accept if price ≥ $80")
- [ ] Busy mode toggle (temporarily disable popups)
- [ ] Sound notification on new request
- [ ] Queue multiple requests
- [ ] Client history view before accepting

### Technical
- [ ] Cron job to expire old requests
- [ ] SMS fallback if no response in 30s
- [ ] Analytics dashboard (acceptance rates, response times)
- [ ] Rate limiting (max 3 quick-finds per client per hour)

---

## 📝 Notes for Deployment

### Vercel Limitation
⚠️ **Custom servers don't work on Vercel**. Vercel uses serverless functions which don't support WebSockets.

### Alternative Options
1. **Use Vercel + External WebSocket Service**:
   - Deploy Next.js app to Vercel (remove custom server)
   - Use Pusher, Ably, or AWS API Gateway for WebSockets
   - Keep API routes for REST fallback

2. **Use Different Platform**:
   - Railway.app
   - Render.com
   - Heroku
   - AWS EC2/ECS
   - DigitalOcean App Platform

All support Node.js custom servers with WebSockets.

### Environment Variables for Production
Add these to your deployment platform:
```
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-here
DATABASE_URL=your-postgres-connection-string
```

---

## 🎉 Summary

You now have a complete real-time matching system that:
✅ Allows clients to quickly find available businesses
✅ Notifies businesses instantly with persistent popups
✅ Handles race conditions (first accept wins)
✅ Uses WebSockets for real-time bidirectional communication
✅ Survives page navigation
✅ Includes timers, animations, and modern UI

**Start the server with `npm run dev` and test it out!** 🚀
