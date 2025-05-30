import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    username: string;
    balance: number;
  }

  interface Session {
    user: User & {
      id: string;
      username: string;
      balance: number;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    balance: number;
  }
}