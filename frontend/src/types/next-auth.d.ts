import 'next-auth';

export type UserRole = 'USER' | 'ADMIN';

declare module 'next-auth' {
  interface User {
    id: string;
    role: UserRole;
    isAdmin: boolean;
    email: string;
    emailVerified: Date | null;
    twoFactorEnabled: boolean;
    name?: string | null;
  }

  interface Session {
    user: User & {
      id: string;
      role: UserRole;
      isAdmin: boolean;
    };
  }
}