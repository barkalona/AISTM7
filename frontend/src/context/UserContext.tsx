'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface UserContextType {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

const UserContext = createContext<UserContextType>({
  user: null,
  status: 'loading'
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserContextType['user']>(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || '',
        role: session.user.role || 'user'
      });
    } else {
      setUser(null);
    }
  }, [session, status]);

  return (
    <UserContext.Provider value={{ user, status }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);