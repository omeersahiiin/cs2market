import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
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
      console.log('Test user already exists');
      return;
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

    console.log('Test user created successfully:', {
      id: user.id,
      email: user.email,
      username: user.username,
      balance: user.balance
    });
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 