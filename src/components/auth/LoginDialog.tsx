'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { signIn, signUp, getOrCreateProfile } from "@/lib/supabase";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LoginDialogProps {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  redirectPath?: string;
  enforceLogin?: boolean;
}

export default function LoginDialog({
  isOpen,
  onOpenChange,
  redirectPath,
  enforceLogin = true,
}: LoginDialogProps) {
  const { user, isLoading, refreshAuth } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  // Close dialog if user becomes authenticated
  useEffect(() => {
    if (user && onOpenChange && !isLoading) {
      onOpenChange(false);
      if (redirectPath) {
        router.push(redirectPath);
      }
    }
  }, [user, isLoading, onOpenChange, redirectPath, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      // Try signing in with email/password
      const { data, error: signInError } = await signIn(email, password);
      
      if (signInError) {
        throw signInError;
      }
      
      if (data.session) {
        await refreshAuth();
        
        // Dispatch custom event to notify other components about auth state change
        window.dispatchEvent(new Event('auth-state-changed'));
        
        // Clear form fields
        setEmail("");
        setPassword("");
        
        // If there's no redirectPath, reload the page to refresh all components
        if (!redirectPath) {
          // Wait a moment for the auth state to propagate
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
        // Dialog will be closed by the useEffect above when user state updates
      } else {
        throw new Error("Sign in failed - no session returned");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      // Clean email input
      const cleanEmail = email.trim().toLowerCase();
      
      // Sign up with Supabase
      const { data, error: signUpError } = await signUp(cleanEmail, password);
      
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('This email is already registered. Try signing in instead.');
        }
        
        throw new Error(signUpError.message || "Failed to create account. Please try again.");
      }

      if (!data.user) {
        throw new Error("Failed to create account. Please try again.");
      }

      // Create a profile for the user
      if (data.user) {
        await getOrCreateProfile(data.user.id, data.user.email || cleanEmail);
      }

      // Handle signup result - with or without immediate session
      if (!data.session) {
        setSuccessMessage("Account created successfully! The page will refresh in a moment...");
        // Clear form fields
        setEmail("");
        setPassword("");
        // Add page reload after brief delay to refresh the UI state
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        // Clear form fields
        setEmail("");
        setPassword("");
        // If we have a session, user is logged in already
        await refreshAuth();
        window.dispatchEvent(new Event('auth-state-changed'));
        
        if (!redirectPath) {
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during sign up");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent closing the dialog if login is enforced
  const handleOpenChange = (open: boolean) => {
    if (!open && enforceLogin && !user) {
      // Don't allow closing if enforcing login and user isn't logged in
      return;
    }
    
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>
            Please sign in or create an account to access Inventio's PDF viewer and document library.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as "signin" | "signup")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-4">
              {successMessage}
            </div>
          )}

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="grid gap-2">
                <label htmlFor="signin-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={isSubmitting}
                  className="w-full"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="signin-password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="w-full"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid gap-2">
                <label htmlFor="signup-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={isSubmitting}
                  className="w-full"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="signup-password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8+ characters"
                  disabled={isSubmitting}
                  className="w-full"
                  required
                  minLength={8}
                />
              </div>

              <div className="text-xs text-gray-500">
                By signing up, you agree to our{" "}
                <a href="/terms" className="text-primary hover:text-primary/80 transition-colors">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-primary hover:text-primary/80 transition-colors">
                  Privacy Policy
                </a>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 