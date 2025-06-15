import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json({
    error: 'Schema deployment temporarily disabled',
    message: 'Please run: npx prisma db push manually to deploy crypto deposit tables',
    note: 'This endpoint will be re-enabled after database migration'
  }, { status: 503 });
} 