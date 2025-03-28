"use client"

import '@/lib/polyfills';
import { useState, useEffect } from "react"
import OptimalPDFViewer from "@/components/OptimalPDFViewer"
import MobileDetectionOverlay from "@/components/MobileDetectionOverlay"
import LoginDialog from "@/components/auth/LoginDialog"
import { getCurrentUser } from '@/lib/supabase'

export default function TestPDFViewer() {
  const [user, setUser] = useState<any>(null);
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);

  // Get the current user when component mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setShowLoginDialog(false);
        } else {
          // User is not authenticated, show login dialog
          setShowLoginDialog(true);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        // Show login dialog in case of error
        setShowLoginDialog(true);
      }
    };
    
    fetchUser();
    
    // Listen for auth state changes
    const handleAuthStateChange = async () => {
      await fetchUser();
    };
    
    window.addEventListener('auth-state-changed', handleAuthStateChange);
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange);
    };
  }, []);

  return (
    <div className="h-screen">
      {/* Mobile Detection Overlay */}
      <MobileDetectionOverlay />

      {/* Login Dialog - Force login for PDF viewer */}
      <LoginDialog 
        isOpen={showLoginDialog} 
        onOpenChange={setShowLoginDialog}
        enforceLogin={true}
      />

      <OptimalPDFViewer pdfUrl="/89f0a20f-6750-4cd3-bec2-e573bc84efe4.pdf" />
    </div>
  )
}