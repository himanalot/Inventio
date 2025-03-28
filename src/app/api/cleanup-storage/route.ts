import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Clean up everything
    await supabase.rpc('exec_sql', {
      sql: `
        -- Drop all policies
        DROP POLICY IF EXISTS "Allow authenticated users to use pdfs bucket" ON storage.buckets;
        DROP POLICY IF EXISTS "Allow authenticated users to select their files" ON storage.objects;
        DROP POLICY IF EXISTS "Allow authenticated users to insert their files" ON storage.objects;
        DROP POLICY IF EXISTS "Allow authenticated users to delete their files" ON storage.objects;

        -- Delete all objects in the pdfs bucket
        DELETE FROM storage.objects 
        WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'pdfs');

        -- Delete the pdfs bucket
        DELETE FROM storage.buckets WHERE name = 'pdfs';
      `
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cleaning up storage:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 