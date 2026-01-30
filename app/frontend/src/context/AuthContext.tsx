import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  userId: string | null;
  assets: string[];
  login: (token: string, userId: string, assets: string[]) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token');
  });
  const [userId, setUserId] = useState<string | null>(() => {
    return localStorage.getItem('auth_userId');
  });
  const [assets, setAssets] = useState<string[]>(() => {
    const stored = localStorage.getItem('auth_assets');
    return stored ? JSON.parse(stored) : [];
  });

  const login = (newToken: string, newUserId: string, newAssets: string[]) => {
    setToken(newToken);
    setUserId(newUserId);
    setAssets(newAssets);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_userId', newUserId);
    localStorage.setItem('auth_assets', JSON.stringify(newAssets));
  };

  const logout = () => {
    setToken(null);
    setUserId(null);
    setAssets([]);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_userId');
    localStorage.removeItem('auth_assets');
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, userId, assets, login, logout, isAuthenticated }}>
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
