'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../utils/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  workspaceId: string;
}

interface Workspace {
  id: string;
  name: string;
  subscriptionPlan: string;
  messageUsageThisMonth: number;
  messageLimit: number;
  userLimit?: number;
  contactLimit?: number;
  leadLimit?: number;
  whatsappLimit?: number;
  storageLimit?: number;
  planExpiryDate?: string;
  status?: string;
  logoUrl?: string;
  faviconUrl?: string;
  customDomain?: string;
  brandColorPrimary?: string;
  brandColorSecondary?: string;
}

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (companyName: string, name: string, email: string, password: string) => Promise<void>;
  googleLogin: (googleId: string, email: string, name: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  impersonate: (token: string, targetUser: User, targetWorkspace: Workspace) => void;
  exitImpersonation: () => Promise<void>;
  isImpersonating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      setWorkspace(response.data.workspace);
    } catch (err) {
      logout();
    }
  };

  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('whatsflow_token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.user);
          setWorkspace(response.data.workspace);
          setIsImpersonating(localStorage.getItem('whatsflow_super_token') !== null);
        } catch (err) {
          console.error('Failed to authenticate token:', err);
          localStorage.removeItem('whatsflow_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('whatsflow_token', response.data.token);
      setUser(response.data.user);
      setWorkspace(response.data.workspace);
      setIsImpersonating(false);
      
      if (response.data.user.role === 'superadmin') {
        router.push('/super-admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setLoading(false);
      throw new Error(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (companyName: string, name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/signup', { companyName, name, email, password });
      localStorage.setItem('whatsflow_token', response.data.token);
      setUser(response.data.user);
      setWorkspace(response.data.workspace);
      setIsImpersonating(false);
      router.push('/dashboard');
    } catch (err: any) {
      setLoading(false);
      throw new Error(err.response?.data?.error || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (googleId: string, email: string, name: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/google', { googleId, email, name });
      localStorage.setItem('whatsflow_token', response.data.token);
      setUser(response.data.user);
      setWorkspace(response.data.workspace);
      setIsImpersonating(false);
      router.push('/dashboard');
    } catch (err: any) {
      setLoading(false);
      throw new Error(err.response?.data?.error || 'Failed Google authentication');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('whatsflow_token');
    localStorage.removeItem('whatsflow_super_token');
    setUser(null);
    setWorkspace(null);
    setIsImpersonating(false);
    router.push('/login');
  };

  const impersonate = (token: string, targetUser: User, targetWorkspace: Workspace) => {
    const currentToken = localStorage.getItem('whatsflow_token');
    if (currentToken) {
      localStorage.setItem('whatsflow_super_token', currentToken);
    }
    localStorage.setItem('whatsflow_token', token);
    setUser(targetUser);
    setWorkspace(targetWorkspace);
    setIsImpersonating(true);
    router.push('/dashboard');
  };

  const exitImpersonation = async () => {
    const superToken = localStorage.getItem('whatsflow_super_token');
    if (superToken) {
      localStorage.setItem('whatsflow_token', superToken);
      localStorage.removeItem('whatsflow_super_token');
      setIsImpersonating(false);
      setLoading(true);
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        setWorkspace(response.data.workspace);
        router.push('/super-admin/companies');
      } catch (err) {
        console.error('Error exiting impersonation:', err);
        logout();
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      workspace, 
      loading, 
      login, 
      signup, 
      googleLogin, 
      logout, 
      refreshProfile,
      impersonate,
      exitImpersonation,
      isImpersonating
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
