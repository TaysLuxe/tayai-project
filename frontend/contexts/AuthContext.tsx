'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/utils/api';
import { tokenStorage } from '@/utils/storage';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = tokenStorage.getAccessToken();
      if (token) {
        try {
          const userData = await authApi.verify();
          if (userData.valid) {
            setUser({
              user_id: userData.user_id,
              username: userData.username,
              tier: userData.tier,
              is_admin: userData.is_admin,
            });
          } else {
            tokenStorage.removeTokens();
          }
        } catch (error) {
          tokenStorage.removeTokens();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authApi.login(username, password);
    tokenStorage.setAccessToken(response.access_token);
    tokenStorage.setRefreshToken(response.refresh_token);
    
    const userData = await authApi.verify();
    setUser({
      user_id: userData.user_id,
      username: userData.username,
      tier: userData.tier,
      is_admin: userData.is_admin,
    });
  };

  const logout = () => {
    tokenStorage.removeTokens();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.verify();
      if (userData.valid) {
        setUser({
          user_id: userData.user_id,
          username: userData.username,
          tier: userData.tier,
          is_admin: userData.is_admin,
        });
      }
    } catch (error) {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

