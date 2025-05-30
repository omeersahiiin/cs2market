import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST() {
  try {
    const email = 'omeersahiiin8@gmail.com';
    const username = 'omeersahiiin';
    const password = 'b60ctvoybj';

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Test user already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create test user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        balance: 10000, // Starting balance for testing
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Test user created successfully',
      user: userWithoutPassword
    }, { status: 201 });
  } catch (error) {
    console.error('Test user creation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 