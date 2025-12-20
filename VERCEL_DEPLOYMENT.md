# Vercel Deployment Guide - Prisma Migration Configuration

## Required Environment Variables in Vercel

Set these in your Vercel Project Settings → Environment Variables:

### 1. Database URLs (CRITICAL for migrations)

```bash
# DATABASE_URL - For runtime queries (can be pooled)
DATABASE_URL="postgresql://user:password@host/database?pgbouncer=true"

# DIRECT_URL - For migrations (must be direct, non-pooled)
DIRECT_URL="postgresql://user:password@host/database"
```

**Important Notes:**
- If using **Vercel Postgres** or **Neon**, get both URLs from your database dashboard
- If using **Railway**, both URLs will be the same (Railway doesn't use connection pooling)
- `DIRECT_URL` is REQUIRED for `prisma migrate deploy` to work in Vercel builds

### 2. NextAuth Configuration

```bash
# Generate a random secret: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-here-keep-this-secure"

# Production URL
NEXTAUTH_URL="https://your-app.vercel.app"
```

### 3. WebSocket Server (Railway)

```bash
# Your Railway WebSocket server URL
NEXT_PUBLIC_WS_URL="wss://your-railway-app.railway.app"

# Shared secret between Next.js and WebSocket server
WS_SECRET="your-websocket-secret"
```

### 4. File Upload (Uploadthing)

```bash
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="your-app-id"
```

---

## Vercel Build Configuration

### Option 1: Add to `package.json` (Recommended)

Update your `package.json` build script:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### Option 2: Create `vercel.json`

```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build",
  "installCommand": "npm install"
}
```

---

## Deployment Checklist

✅ **Before First Deploy:**
1. Push your database schema to production:
   ```bash
   npx prisma migrate deploy
   ```

2. Set all environment variables in Vercel dashboard

3. Ensure `DIRECT_URL` is set (Vercel builds will fail without it)

✅ **After Each Schema Change:**
1. Create migration locally:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

2. Commit and push migration files

3. Vercel will automatically run `prisma migrate deploy` during build

---

## Troubleshooting

### Error: "Can't reach database server"
- Check `DIRECT_URL` is set correctly (not pooled)
- Ensure database allows connections from Vercel IPs

### Error: "Environment variable not found: DIRECT_URL"
- Add `DIRECT_URL` to Vercel environment variables
- Redeploy after adding the variable

### Migration fails on Vercel
- Ensure migration files are committed to git
- Check that production database is accessible
- Verify `DIRECT_URL` has proper permissions

---

## Database URL Examples

### Vercel Postgres
```bash
DATABASE_URL="postgres://default:xxx@xxx-pooler.us-east-1.postgres.vercel-storage.com/verceldb?pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgres://default:xxx@xxx.us-east-1.postgres.vercel-storage.com/verceldb"
```

### Neon
```bash
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### Railway / Supabase
```bash
# Both URLs are the same (no pooling)
DATABASE_URL="postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres"
```
