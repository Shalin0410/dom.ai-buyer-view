// Updated Auth Hook using Service Layer
import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { authService, AuthUser } from '@/services';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string) => {
    try {
      const siteUrl = (import.meta as any)?.env?.VITE_SITE_URL || window.location.origin;
      const redirectTo = `${siteUrl}/auth/callback`;
      const response = await authService.signInWithMagicLink(email, redirectTo);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to send magic link');
      }
    } catch (error) {
      console.error('Error in signInWithEmail:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const response = await authService.signOut();
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to sign out');
      }
      
      setUser(null);
    } catch (error) {
      console.error('Error in signOut:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithEmail,
    signOut,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};
