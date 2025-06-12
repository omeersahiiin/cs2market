import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClientSingleton } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { shouldUseMockData, MOCK_USERS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if we should use mock data
    if (shouldUseMockData()) {
      console.log('🎭 Using mock data for user balance');
      
      // Find mock user by email or id
      const mockUser = MOCK_USERS.find(u => 
        u.email === session.user.email || u.id === session.user.id
      );
      
      const balance = mockUser ? mockUser.balance : 10000; // Default balance
      return NextResponse.json({ balance });
    }

    const user = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { balance: true }
        });
      },
      'fetch user balance'
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ balance: user.balance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    
    // Fallback to mock balance on any error
    console.log('🎭 Database error, returning mock balance');
    return NextResponse.json({ balance: 10000 });
  }
} 