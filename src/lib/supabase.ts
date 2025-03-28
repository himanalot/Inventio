import { createClient } from '@supabase/supabase-js'
import { type Database } from './database.types'

// This creates a single Supabase client that can be used throughout the app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Function to get or create user profile
export async function getOrCreateProfile(userId: string, email: string) {
  try {
    // Check if profile exists
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    // If no profile exists, create one
    if (fetchError && fetchError.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          full_name: '',
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
      
      if (insertError) {
        throw insertError
      }
      
      return { id: userId, full_name: '', avatar_url: null }
    }
    
    if (fetchError) {
      throw fetchError
    }
    
    return profile
  } catch (error) {
    // Only log critical errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in getOrCreateProfile:', error)
    }
    throw error
  }
}

// Cache session checks to reduce API calls
let sessionCache: {
  session: any;
  expiresAt: number;
} | null = null;

const SESSION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to check the current session
export async function checkSession() {
  try {
    // Check cache first
    if (sessionCache && Date.now() < sessionCache.expiresAt) {
      return sessionCache.session;
    }

    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      throw error
    }

    // Update cache
    if (data.session) {
      sessionCache = {
        session: data.session,
        expiresAt: Date.now() + SESSION_CACHE_DURATION
      };
    } else {
      sessionCache = null;
    }
    
    return data.session
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error checking session:', error)
    }
    return null
  }
}

// Function to refresh the session
export async function refreshSession() {
  try {
    // Clear session cache
    sessionCache = null;

    // Attempt to refresh the session
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      throw error
    }

    // Update cache with new session
    if (data.session) {
      sessionCache = {
        session: data.session,
        expiresAt: Date.now() + SESSION_CACHE_DURATION
      };
    }
    
    return data.session
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error refreshing session:', error)
    }
    return null
  }
}

// Simple helper to check if user is authenticated
export async function isAuthenticated() {
  const { data, error } = await supabase.auth.getSession();
  return !!data.session;
}

// Get the current user
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user;
}

// Simple sign in function
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

// Simple sign up function
export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

// Simple sign out function
export async function signOut() {
  return supabase.auth.signOut();
} 