import { NextResponse } from 'next/server';
import { mkdir } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Create the base uploads directory in public folder
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    await mkdir(uploadsDir, { recursive: true });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Uploads directory initialized'
    });
  } catch (error) {
    console.error('Error initializing uploads directory:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to initialize uploads directory'
    }, { status: 500 });
  }
} 