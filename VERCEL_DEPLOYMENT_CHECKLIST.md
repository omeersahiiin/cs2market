# 🚀 Vercel Deployment Checklist

## Pre-Deployment

- [ ] Push code to GitHub repository
- [ ] Set up PostgreSQL database (Neon/Supabase/Railway)
- [ ] Have database connection string ready

## Vercel Setup

1. **Create New Project**
   - [ ] Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - [ ] Click "New Project"
   - [ ] Import from GitHub
   - [ ] Select `cs2-derivatives` folder as root

2. **Environment Variables**
   ```
   DATABASE_URL=postgresql://username:password@hostname/database
   NEXTAUTH_SECRET=your-random-secret-key
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```
   - [ ] Add `DATABASE_URL`
   - [ ] Add `NEXTAUTH_SECRET` (generate with: `openssl rand -base64 32`)
   - [ ] Add `NEXTAUTH_URL`

3. **Deploy**
   - [ ] Click "Deploy"
   - [ ] Wait for build completion

## Post-Deployment

1. **Database Setup**
   - [ ] Run `npx prisma db push` locally with production DATABASE_URL
   - [ ] OR visit `https://your-domain.vercel.app/api/migrate`

2. **Seed Data**
   - [ ] Visit `https://your-domain.vercel.app/api/seed-skins` (if needed)

3. **Create Test Accounts**
   - [ ] Send POST request to `https://your-domain.vercel.app/api/create-test-accounts`
   - [ ] OR use curl: `curl -X POST https://your-domain.vercel.app/api/create-test-accounts`

4. **Test Functionality**
   - [ ] Visit your deployed site
   - [ ] Test user registration/login
   - [ ] Test trading functionality
   - [ ] Verify order book updates

## Test Accounts Created

After running the account creation endpoint, your friends can use:

**Password for all accounts: `cs2trading123`**
**Starting balance: $25,000 each**

| Username | Email |
|----------|-------|
| alex_trader | alex@cs2trading.com |
| sarah_pro | sarah@cs2trading.com |
| mike_sniper | mike@cs2trading.com |
| emma_ak47 | emma@cs2trading.com |
| david_awp | david@cs2trading.com |
| lisa_knife | lisa@cs2trading.com |
| james_glock | james@cs2trading.com |
| anna_m4a4 | anna@cs2trading.com |
| tom_deagle | tom@cs2trading.com |
| kate_usp | kate@cs2trading.com |

## Quick Commands

```bash
# Generate secret key
openssl rand -base64 32

# Deploy with Vercel CLI
npm i -g vercel
vercel login
vercel --prod

# Create test accounts (after deployment)
curl -X POST https://your-domain.vercel.app/api/create-test-accounts

# Check database status
curl https://your-domain.vercel.app/api/migrate
```

## Troubleshooting

- **Build fails**: Check environment variables are set
- **Database errors**: Verify DATABASE_URL and run migrations
- **Auth issues**: Ensure NEXTAUTH_SECRET and NEXTAUTH_URL are correct
- **404 errors**: Make sure root directory is set to `cs2-derivatives`

---

**🎉 Ready to share with friends!**

Send them:
1. Your Vercel URL
2. Test account credentials above
3. Instructions to start trading CS2 derivatives! 