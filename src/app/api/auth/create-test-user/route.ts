import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { shouldUseMockData, MOCK_USERS } from '@/lib/mock-data';

// Conditional Prisma import
let PrismaClient: any;
let prisma: any = null;

try {
  if (!shouldUseMockData()) {
    const PrismaModule = require('@prisma/client');
    PrismaClient = PrismaModule.PrismaClient;
    prisma = new PrismaClient();
  }
} catch (error) {
  console.log('Prisma not available, using mock data');
  prisma = null;
}

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json();

    // If using mock data, just return success
    if (shouldUseMockData() || !prisma) {
      console.log('🎭 Using mock data for user creation');
      return NextResponse.json({ 
        message: 'Mock user created successfully',
        user: { email, username, id: 'mock-user-' + Date.now() }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        balance: 10000.0
      }
    });

    return NextResponse.json({ 
      message: 'User created successfully',
      user: { id: user.id, email: user.email, username: user.username }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 