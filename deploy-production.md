# 🚀 Production Deployment Guide

## Quick Deploy to Vercel (Recommended)

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy
```bash
vercel --prod
```

### 3. Set Environment Variables in Vercel Dashboard
- `DATABASE_URL`: Your Supabase connection string
- `NEXT_PUBLIC_SUPABASE_URL`: https://oaobkrhfctwjoyibctun.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon key
- `NEXTAUTH_SECRET`: Random secret key
- `NEXTAUTH_URL`: Your production URL

## Alternative: Manual Build
```bash
npm run build
npm start
```

## Custom Domain Setup
1. Buy domain from registrar
2. Add domain in Vercel dashboard
3. Update DNS records
4. Update `NEXTAUTH_URL` to your domain

## Production Checklist
- [ ] Database deployed ✅ (Done!)
- [ ] Environment variables set
- [ ] SSL certificate (automatic with Vercel)
- [ ] Custom domain (optional)
- [ ] Analytics setup (optional)
- [ ] Error monitoring (optional)

Your CS2 trading platform will be live at:
`https://your-app-name.vercel.app` 