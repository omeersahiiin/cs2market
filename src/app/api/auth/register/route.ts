import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClientSingleton } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, username, password } = await request.json();

    // Validate input
    if (!email || !username || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.user.findFirst({
          where: {
            OR: [
              { email },
              { username }
            ]
          }
        });
      },
      'check existing user'
    );

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.user.create({
          data: {
            email,
            username,
            password: hashedPassword,
            balance: 10000, // Starting balance for testing
          },
        });
      },
      'create new user'
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 