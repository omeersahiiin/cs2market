import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const email = 'omeersahiiin8@gmail.com';
    
    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    });

    if (user) {
      console.log('User found:', {
        id: user.id,
        email: user.email,
        username: user.username,
        balance: user.balance
      });
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 