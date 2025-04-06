"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// Define the auth context type
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
};

// Create the auth context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signOut: async () => {},
  refreshAuth: async () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const isInitialized = useRef(false);
  const lastEvent = useRef<string | null>(null);
  const lastUserId = useRef<string | null>(null);

  // Function to refresh authentication state
  const refreshAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser || null);
      lastUserId.current = currentUser?.id || null;
      setIsLoading(false);
    } catch (error) {
      console.error('Error refreshing auth state:', error);
      setUser(null);
      lastUserId.current = null;
      setIsLoading(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      lastUserId.current = null;
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Initialize authentication state
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initAuth = async () => {
      await refreshAuth();
    };

    initAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip INITIAL_SESSION events as they can cause duplicate updates in Chrome
        if (event === 'INITIAL_SESSION') {
          return;
        }

        // Prevent duplicate SIGNED_IN events for the same user
        if (event === 'SIGNED_IN' && session?.user?.id === lastUserId.current) {
          return;
        }

        console.log(`Auth state changed: ${event}`, session?.user?.id || 'No user');
        lastEvent.current = event;
        
        if (session?.user) {
          setUser(session.user);
          lastUserId.current = session.user.id;
        } else {
          setUser(null);
          lastUserId.current = null;
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut: handleSignOut,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 