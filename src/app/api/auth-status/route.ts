import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface AuthStatus {
  authenticated: boolean;
  userId?: string;
  error?: string;
}

export async function GET(req: NextRequest) {
  try {
    // Check session server-side
    const supabase = createRouteHandlerClient({ cookies });
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return NextResponse.json({
        authenticated: false,
        error: 'Session error'
      });
    }
    
    return NextResponse.json({
      authenticated: !!data.session,
      userId: data.session?.user?.id
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      error: 'Server error'
    }, { status: 500 });
  }
} 