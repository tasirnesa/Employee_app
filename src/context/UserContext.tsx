import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types/interfaces';
import api from '../lib/axios';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      setUser(JSON.parse(storedProfile));
    }
    const token = localStorage.getItem('token');
    // Enrich/refresh current user from backend (ensures profileImageUrl is present)
    if (token) {
      api.get('/api/users/me')
        .then((res) => {
          if (res?.data) {
            setUser(res.data);
            localStorage.setItem('userProfile', JSON.stringify(res.data));
          }
        })
        .catch(() => {
          // ignore
        });
    }
  }, []);

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;