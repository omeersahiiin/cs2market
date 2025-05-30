import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Test accounts for friends
const TEST_ACCOUNTS = [
  { email: 'alex@cs2trading.com', username: 'alex_trader', name: 'Alex', balance: 25000 },
  { email: 'sarah@cs2trading.com', username: 'sarah_pro', name: 'Sarah', balance: 25000 },
  { email: 'mike@cs2trading.com', username: 'mike_sniper', name: 'Mike', balance: 25000 },
  { email: 'emma@cs2trading.com', username: 'emma_ak47', name: 'Emma', balance: 25000 },
  { email: 'david@cs2trading.com', username: 'david_awp', name: 'David', balance: 25000 },
  { email: 'lisa@cs2trading.com', username: 'lisa_knife', name: 'Lisa', balance: 25000 },
  { email: 'james@cs2trading.com', username: 'james_glock', name: 'James', balance: 25000 },
  { email: 'anna@cs2trading.com', username: 'anna_m4a4', name: 'Anna', balance: 25000 },
  { email: 'tom@cs2trading.com', username: 'tom_deagle', name: 'Tom', balance: 25000 },
  { email: 'kate@cs2trading.com', username: 'kate_usp', name: 'Kate', balance: 25000 }
];

export async function POST(request: NextRequest) {
  try {
    const hashedPassword = await bcrypt.hash('cs2trading123', 12);
    const results = [];

    for (const account of TEST_ACCOUNTS) {
      try {
        // Check if account already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: account.email }
        });

        if (existingUser) {
          // Update existing account
          await prisma.user.update({
            where: { email: account.email },
            data: { 
              balance: account.balance,
              username: account.username
            }
          });
          results.push({
            name: account.name,
            email: account.email,
            username: account.username,
            status: 'updated'
          });
        } else {
          // Create new account
          await prisma.user.create({
            data: {
              email: account.email,
              username: account.username,
              password: hashedPassword,
              balance: account.balance
            }
          });
          results.push({
            name: account.name,
            email: account.email,
            username: account.username,
            status: 'created'
          });
        }
      } catch (error) {
        results.push({
          name: account.name,
          email: account.email,
          username: account.username,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Get total user count
    const totalUsers = await prisma.user.count();

    return NextResponse.json({
      success: true,
      message: 'Test accounts processed successfully',
      results,
      totalUsers,
      credentials: {
        password: 'cs2trading123',
        balance: '$25,000 each'
      }
    });

  } catch (error) {
    console.error('Error creating test accounts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'CS2 Trading Platform - Test Account Creator',
    instructions: 'Send a POST request to this endpoint to create 10 test accounts',
    accounts: TEST_ACCOUNTS.map(acc => ({
      name: acc.name,
      username: acc.username,
      email: acc.email
    })),
    credentials: {
      password: 'cs2trading123',
      balance: '$25,000 each'
    }
  });
} 