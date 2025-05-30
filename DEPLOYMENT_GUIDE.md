# 🚀 CS2 Derivatives Trading Platform - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **PostgreSQL Database**: Set up a production database (recommended: Neon, Supabase, or Railway)

## Step 1: Database Setup

### Option A: Neon (Recommended)
1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (it looks like: `postgresql://username:password@hostname/database`)

### Option B: Supabase
1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to Settings > Database
3. Copy the connection string

### Option C: Railway
1. Go to [railway.app](https://railway.app) and create a project
2. Add a PostgreSQL service
3. Copy the connection string from the Variables tab

## Step 2: Deploy to Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `cs2-derivatives` folder as the root directory

2. **Configure Environment Variables**:
   ```
   DATABASE_URL=your_postgresql_connection_string
   NEXTAUTH_SECRET=your_random_secret_key_here
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

3. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete

### Method 2: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

## Step 3: Environment Variables Setup

In your Vercel dashboard, go to your project settings and add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Your PostgreSQL connection string |
| `NEXTAUTH_SECRET` | `your-secret-key` | Random string for NextAuth (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | Your production URL |

## Step 4: Database Migration

After deployment, you need to run the database migration:

1. **Option A: Local Migration** (if you have the database URL):
   ```bash
   npx prisma db push
   npx prisma generate
   ```

2. **Option B: Vercel Functions** (create a migration endpoint):
   - The platform includes a migration endpoint at `/api/migrate`
   - Visit `https://your-domain.vercel.app/api/migrate` once after deployment

## Step 5: Seed Database (Optional)

To populate your database with CS2 skins and test accounts:

1. **Seed Skins**:
   - Visit `https://your-domain.vercel.app/api/seed-skins`
   - This will populate the database with CS2 skin data

2. **Create Test Accounts**:
   - Use the account creation script or create them manually through the UI

## Step 6: Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Domains" tab
3. Add your custom domain
4. Update `NEXTAUTH_URL` environment variable to your custom domain

## Test Accounts for Friends

Here are 10 test accounts ready for your friends:

| Name | Username | Email | Password |
|------|----------|-------|----------|
| Alex | alex_trader | alex@cs2trading.com | cs2trading123 |
| Sarah | sarah_pro | sarah@cs2trading.com | cs2trading123 |
| Mike | mike_sniper | mike@cs2trading.com | cs2trading123 |
| Emma | emma_ak47 | emma@cs2trading.com | cs2trading123 |
| David | david_awp | david@cs2trading.com | cs2trading123 |
| Lisa | lisa_knife | lisa@cs2trading.com | cs2trading123 |
| James | james_glock | james@cs2trading.com | cs2trading123 |
| Anna | anna_m4a4 | anna@cs2trading.com | cs2trading123 |
| Tom | tom_deagle | tom@cs2trading.com | cs2trading123 |
| Kate | kate_usp | kate@cs2trading.com | cs2trading123 |

**Each account has $25,000 starting balance for testing!**

## Troubleshooting

### Build Errors
- Ensure all environment variables are set
- Check that your database is accessible
- Verify your `package.json` scripts

### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Ensure your database allows connections from Vercel IPs
- Check if you need to whitelist Vercel's IP ranges

### NextAuth Issues
- Ensure `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your domain exactly
- Check that your domain is properly configured

## Performance Optimization

### Database
- Enable connection pooling in your database provider
- Consider using Prisma Data Proxy for better connection management

### Vercel
- Enable Edge Runtime for API routes where possible
- Use Vercel Analytics to monitor performance
- Set up proper caching headers

## Monitoring

1. **Vercel Analytics**: Monitor page views and performance
2. **Database Monitoring**: Use your database provider's monitoring tools
3. **Error Tracking**: Consider adding Sentry for error tracking

## Security Checklist

- ✅ Environment variables are properly set
- ✅ Database credentials are secure
- ✅ NEXTAUTH_SECRET is a strong random string
- ✅ CORS is properly configured
- ✅ Rate limiting is in place (if needed)

## Post-Deployment

1. **Test all functionality**:
   - User registration/login
   - Trading operations
   - Order book updates
   - P&L calculations

2. **Monitor performance**:
   - Check response times
   - Monitor database connections
   - Watch for any errors

3. **Share with friends**:
   - Send them the URL and test account credentials
   - Provide a quick user guide

## Support

If you encounter any issues:
1. Check Vercel deployment logs
2. Review database connection logs
3. Test locally with production environment variables
4. Check the browser console for client-side errors

---

**🎉 Your CS2 Derivatives Trading Platform is now live!**

Share the URL with your friends and let them start trading CS2 skin derivatives with their $25,000 test accounts! 