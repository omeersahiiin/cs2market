# CS2 Derivatives Trading Platform

A Next.js application for trading CS2 skin derivatives with real-time price updates.

## Features

- **Skin Marketplace**: Browse and view CS2 skins with real-time pricing
- **Derivatives Trading**: Open long/short positions on skin prices
- **Real-time Updates**: Live price updates via Server-Sent Events
- **User Authentication**: Secure login/registration system
- **Portfolio Management**: Track your positions and P&L

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Real-time**: Server-Sent Events (SSE)

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cs2-derivatives
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/cs2_derivatives"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   npx prisma db seed
   ```

5. **Run the development server**
```bash
npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Recent Fixes Applied

### Image Loading Issues
- ✅ Fixed Steam CDN URL configuration in `next.config.js`
- ✅ Updated schema to use `iconPath` instead of full URLs
- ✅ Implemented dynamic Steam CDN URL generation
- ✅ Added fallback SVG image for failed loads

### Database Schema
- ✅ Updated Prisma schema to use `iconPath` field
- ✅ Fixed seed data to use icon paths instead of full URLs
- ✅ Regenerated Prisma client

### Frontend Issues
- ✅ Fixed interface inconsistencies between schema and components
- ✅ Corrected button disable logic for trading functionality
- ✅ Updated import paths and removed unused dependencies

### Build Issues
- ✅ Removed duplicate NextAuth configuration
- ✅ Deleted unused Redux store files
- ✅ Added `dynamic = 'force-dynamic'` to API routes
- ✅ Fixed TypeScript compilation errors

### API Routes
- ✅ Updated API routes to use `iconPath` instead of `imageUrl`
- ✅ Fixed static generation issues for dynamic routes
- ✅ Ensured proper error handling

## Default User Account

The seed script creates a test user:
- **Email**: omeersahiiin8@gmail.com
- **Password**: test123
- **Starting Balance**: $10,000

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── auth/          # Authentication pages
│   ├── skins/         # Skin marketplace pages
│   └── components/    # Shared components
├── lib/
│   ├── auth.ts        # NextAuth configuration
│   ├── prisma.ts      # Prisma client
│   └── utils.ts       # Utility functions
└── types/             # TypeScript type definitions

prisma/
├── schema.prisma      # Database schema
└── seed.js           # Database seed data
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Steam CDN Integration

The application uses Steam's CDN for skin images:
- Base URL: `https://steamcdn-a.akamaihd.net/apps/730/icons/econ/default_generated/`
- Images are dynamically constructed from stored icon paths
- Fallback SVG provided for failed image loads
"# cs2market" 
