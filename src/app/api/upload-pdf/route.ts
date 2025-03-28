import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';

export const maxDuration = 60; // Set max duration to 60 seconds

// Define the maximum file size (20MB)
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // 1. Get the authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // 2. Parse the multipart form data to get the file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // 3. Validate the file
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the maximum limit of 20MB' },
        { status: 400 }
      );
    }
    
    // 4. Generate a unique filename
    const originalFilename = file.name;
    const fileExtension = path.extname(originalFilename);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    
    // 5. Create user's directory if it doesn't exist
    const userUploadsDir = path.join(process.cwd(), 'public', 'uploads', userId);
    await mkdir(userUploadsDir, { recursive: true });
    
    // 6. Save the file
    const filePath = path.join(userUploadsDir, uniqueFilename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    
    // 7. Save metadata to the database
    const fileUrl = `/uploads/${userId}/${uniqueFilename}`;
    const { error } = await supabase.from('user_documents').insert({
      user_id: userId,
      filename: originalFilename,
      file_path: fileUrl,
      file_size: file.size,
      file_type: file.type
    });
    
    if (error) {
      console.error('Error saving file metadata:', error);
      return NextResponse.json(
        { error: 'Failed to save file metadata' },
        { status: 500 }
      );
    }
    
    // 8. Return the file URL
    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      filename: originalFilename,
      type: file.type,
      size: file.size 
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 