import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface SessionInfo {
  userId: string;
  email: string | undefined | null;
}

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const authInfo = {
    fixed: false,
    session: null as SessionInfo | null,
    error: null as string | null
  };

  // Check if a redirect is requested
  const redirectTo = req.nextUrl.searchParams.get('redirect');

  try {
    // Get access to Supabase client
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check for existing auth cookies
    const refreshCookie = cookieStore.get('sb-refresh-token');
    
    // Try to get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Case 1: We have a session - return it or redirect
    if (session) {
      authInfo.fixed = true;
      authInfo.session = {
        userId: session.user.id,
        email: session.user.email
      };
      
      const response = redirectTo 
        ? NextResponse.redirect(new URL(redirectTo, req.url))
        : NextResponse.json(authInfo);
      
      // Set cookies directly in the response
      response.cookies.set('sb-access-token', session.access_token, {
        path: '/',
        maxAge: 3600,
        sameSite: 'lax'
      });
      
      response.cookies.set('sb-refresh-token', session.refresh_token, {
        path: '/',
        maxAge: 7 * 24 * 3600, // 7 days
        sameSite: 'lax'
      });
      
      return response;
    }
    
    // Case 2: Try refreshing the session if we have a refresh token
    if (refreshCookie) {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (data.session) {
        authInfo.fixed = true;
        authInfo.session = {
          userId: data.session.user.id,
          email: data.session.user.email
        };
        
        const response = redirectTo 
          ? NextResponse.redirect(new URL(redirectTo, req.url))
          : NextResponse.json(authInfo);
        
        // Set cookies directly in the response
        response.cookies.set('sb-access-token', data.session.access_token, {
          path: '/',
          maxAge: 3600,
          sameSite: 'lax'
        });
        
        response.cookies.set('sb-refresh-token', data.session.refresh_token, {
          path: '/',
          maxAge: 7 * 24 * 3600, // 7 days
          sameSite: 'lax'
        });
        
        return response;
      }
    }
    
    // Could not fix the session - redirect with error if requested
    if (redirectTo) {
      const url = new URL(redirectTo, req.url);
      url.searchParams.set('auth_error', 'failed_to_fix');
      return NextResponse.redirect(url);
    }
    
    return NextResponse.json(authInfo);
  } catch (error: any) {
    if (redirectTo) {
      const url = new URL(redirectTo, req.url);
      url.searchParams.set('auth_error', 'unknown_error');
      return NextResponse.redirect(url);
    }
    
    return NextResponse.json({
      ...authInfo,
      error: 'Server error'
    });
  }
}