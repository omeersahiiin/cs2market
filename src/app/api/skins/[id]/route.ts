import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const skin = await prisma.skin.findUnique({
      where: {
        id: params.id
      }
    });

    if (!skin) {
      return NextResponse.json(
        { error: 'Skin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(skin);
  } catch (error) {
    console.error('Error fetching skin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skin' },
      { status: 500 }
    );
  }
} 