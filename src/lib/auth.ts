import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { PrismaClientSingleton } from '@/lib/prisma';
import { env } from '@/lib/env';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        try {
          const user = await PrismaClientSingleton.executeWithRetry(
            async (prisma) => {
              return await prisma.user.findUnique({
                where: {
                  email: credentials.email
                }
              });
            },
            'find user for authentication'
          );

          if (!user || !user.password) {
            throw new Error('Invalid credentials');
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isCorrectPassword) {
            throw new Error('Invalid credentials');
          }

          return {
            id: user.id,
            email: user.email,
            username: user.username,
            balance: user.balance,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          throw new Error('Authentication failed - please try again');
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.balance = token.balance;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // Fetch balance from DB if not present
        let balance = user.balance;
        if (typeof balance === 'undefined') {
          try {
            const dbUser = await PrismaClientSingleton.executeWithRetry(
              async (prisma) => {
                return await prisma.user.findUnique({ 
                  where: { id: user.id } 
                });
              },
              'fetch user balance'
            );
            balance = dbUser?.balance ?? 0;
          } catch (error) {
            console.error('Error fetching user balance:', error);
            balance = 0; // Default fallback
          }
        }
        token.id = user.id;
        token.username = user.username;
        token.balance = balance;
      }
      return token;
    }
  },
  secret: env.NEXTAUTH_SECRET,
  debug: env.isDevelopment
}; 