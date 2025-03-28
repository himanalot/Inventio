import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export function SessionFixer() {
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fixSession = async () => {
    setIsLoading(true);
    setStatus("Attempting to fix session...");
    
    try {
      // Get any client-side session data to pass to the API
      const { data: { session } } = await supabase.auth.getSession();
      
      // Create query params with client session data if available
      let url = '/api/fix-auth';
      if (session) {
        const clientData = {
          userId: session.user.id,
          email: session.user.email,
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at
        };
        url += `?clientData=${encodeURIComponent(JSON.stringify(clientData))}`;
      }
      
      // Try to use our session fixer API
      const response = await fetch(url);
      const data = await response.json();
      
      console.log("Session fix attempt response:", data);
      
      if (data.fixed) {
        setStatus("Session fixed! You should now be properly logged in.");
        
        // Wait a bit and reload the page
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return;
      }
      
      // If API didn't fix it, try to force a session refresh
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error("Session refresh error:", refreshError);
        setStatus("Could not refresh session. Try signing out and back in.");
        setIsLoading(false);
        return;
      }
      
      if (refreshData.session) {
        setStatus("Session refreshed successfully!");
        
        // Manually set cookies to ensure they exist
        document.cookie = `sb-access-token=${refreshData.session.access_token}; path=/; max-age=3600; SameSite=Lax`;
        document.cookie = `sb-refresh-token=${refreshData.session.refresh_token}; path=/; max-age=7776000; SameSite=Lax`;
        
        // Wait a bit and reload the page
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return;
      }
      
      setStatus("Could not fix session. Try signing out and back in.");
    } catch (error) {
      console.error("Error fixing session:", error);
      setStatus("An error occurred. Please try signing out and back in.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const forceSignOut = async () => {
    setIsLoading(true);
    setStatus("Signing out...");
    
    try {
      await supabase.auth.signOut();
      
      // Clear cookies manually to be sure
      document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "supabase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      // Clear localStorage items
      if (window.localStorage) {
        window.localStorage.removeItem('supabase-auth');
        window.localStorage.removeItem('supabase.auth.token');
      }
      
      setStatus("Signed out successfully. Redirecting to sign in...");
      
      // Redirect to sign in
      setTimeout(() => {
        window.location.href = '/signin';
      }, 1000);
    } catch (error) {
      console.error("Error signing out:", error);
      setStatus("Error signing out. Please try again.");
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-8">
      <h3 className="text-white font-medium mb-2">Session Issues?</h3>
      
      {status && (
        <div className="mb-3 text-sm text-slate-300 bg-slate-700/50 p-2 rounded">
          {status}
        </div>
      )}
      
      <div className="flex space-x-2">
        <Button 
          size="sm" 
          onClick={fixSession} 
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isLoading ? "Working..." : "Fix Session"}
        </Button>
        
        <Button 
          size="sm"
          variant="outline"
          onClick={forceSignOut}
          disabled={isLoading}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          Force Sign Out
        </Button>
      </div>
    </div>
  );
} 