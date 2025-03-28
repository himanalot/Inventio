import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string; filename: string } }
) {
  const { userId, filename } = params;

  try {
    // 1. Get the cookie store
    const cookieStore = cookies();
    
    // 2. Check for auth cookies first - faster than session check
    const accessToken = cookieStore.get('sb-access-token')?.value;
    const refreshToken = cookieStore.get('sb-refresh-token')?.value;
    
    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Authentication required to access files' },
        { status: 401 }
      );
    }

    // 3. Only create Supabase client if we have cookies
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // 4. Verify the file exists in the database first
    const { data: document, error: dbError } = await supabase
      .from('user_documents')
      .select('file_path, file_type')
      .eq('user_id', userId)
      .eq('file_path', `/uploads/${userId}/${filename}`)
      .single();
      
    if (dbError || !document) {
      return NextResponse.json(
        { error: 'File not found in database' },
        { status: 404 }
      );
    }
    
    // 5. Now check user authorization
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required to access files' },
        { status: 401 }
      );
    }
    
    const currentUserId = session.user.id;
    
    // 6. Check if user is authorized (their file or admin)
    if (currentUserId !== userId) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', currentUserId)
        .single();
        
      const isAdmin = userProfile?.is_admin || false;
      
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Not authorized to access this file' },
          { status: 403 }
        );
      }
    }
    
    // 7. Construct the file path and serve the file
    const filePath = path.join(process.cwd(), 'public', 'uploads', userId, filename);
    
    try {
      const fileBuffer = await fs.readFile(filePath);
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': document.file_type || 'application/pdf',
          'Content-Disposition': `inline; filename="${filename}"`,
          'Cache-Control': 'public, max-age=86400'
        }
      });
    } catch (fileError) {
      return NextResponse.json(
        { error: 'File not found on server' },
        { status: 404 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Server error when serving file' },
      { status: 500 }
    );
  }
} 