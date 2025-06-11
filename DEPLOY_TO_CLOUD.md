# 🚀 Deploy CS2 Trading Platform to Cloud Database

## Current Status
- ✅ New Supabase project created: `oaobkrhfctwjoyibctun`
- ✅ DNS resolving for database
- ⏳ Database still provisioning (port 5432 not responding yet)

## When Database is Ready (Usually 2-10 minutes)

### 1. Test Connection
```bash
node update-new-supabase.js
```

### 2. Deploy Database Schema
```bash
npx prisma migrate deploy
```

### 3. Seed Database with Initial Data
```bash
npx prisma db seed
```

### 4. Get Supabase API Keys
Visit: https://supabase.com/dashboard/project/oaobkrhfctwjoyibctun/settings/api

Copy these keys to your `.env.local`:
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 5. Start Development Server
```bash
npm run dev
```

## Connection Details
- **Project URL**: https://oaobkrhfctwjoyibctun.supabase.co
- **Database URL**: `postgresql://postgres:B60ctvoybj@db.oaobkrhfctwjoyibctun.supabase.co:5432/postgres`
- **Dashboard**: https://supabase.com/dashboard/project/oaobkrhfctwjoyibctun

## Troubleshooting

### If Database Still Not Ready After 10+ Minutes
1. Check project status in Supabase dashboard
2. Try creating a new project (sometimes projects get stuck)
3. Consider alternative: Neon, PlanetScale, or Railway

### Alternative Quick Setup (Neon - 2 minutes)
```bash
# If Supabase continues having issues
npm install -g @neondatabase/cli
neon auth
neon projects create --name cs2-trading
```

## Production Deployment Checklist
- [ ] Database schema deployed
- [ ] Initial data seeded
- [ ] API keys configured
- [ ] Environment variables set
- [ ] SSL/TLS enabled (automatic with Supabase)
- [ ] Connection pooling configured (automatic)
- [ ] Backups enabled (automatic with Supabase Pro)

## Performance Optimization
Your current setup includes:
- Connection pooling (20 connections)
- Statement timeout (30s)
- Optimized indexes for trading operations
- Real-time subscriptions ready

## Cost Estimate
- **Development**: $0/month (free tier)
- **Production**: $25/month (Supabase Pro)
- **Revenue Potential**: $11,000/month (93% profit margin)

---

🎯 **Next Action**: Wait for database provisioning to complete, then run the deployment commands above. 