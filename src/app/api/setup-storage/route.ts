import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Step 1: Create the bucket
    const { error: createError } = await supabase.storage.createBucket('pdfs', {
      public: false,
      allowedMimeTypes: ['application/pdf'],
      fileSizeLimit: 20971520 // 20MB
    })

    if (createError && !createError.message.includes('already exists')) {
      throw createError
    }

    // Step 2: Set up policies
    await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing policies
        DROP POLICY IF EXISTS "Allow authenticated users to use pdfs bucket" ON storage.buckets;
        DROP POLICY IF EXISTS "Allow authenticated users to select their files" ON storage.objects;
        DROP POLICY IF EXISTS "Allow authenticated users to insert their files" ON storage.objects;
        DROP POLICY IF EXISTS "Allow authenticated users to delete their files" ON storage.objects;

        -- Create bucket policy
        CREATE POLICY "Allow authenticated users to use pdfs bucket"
        ON storage.buckets FOR ALL TO authenticated
        USING (name = 'pdfs');

        -- Create object policies
        CREATE POLICY "Allow authenticated users to select their files"
        ON storage.objects FOR SELECT TO authenticated
        USING (
          bucket_id = (SELECT id FROM storage.buckets WHERE name = 'pdfs')
          AND (
            auth.uid() = owner
            OR position(auth.uid()::text || '/' in name) = 1
          )
        );

        CREATE POLICY "Allow authenticated users to insert their files"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (
          bucket_id = (SELECT id FROM storage.buckets WHERE name = 'pdfs')
          AND (
            auth.uid() = owner
            OR position(auth.uid()::text || '/' in name) = 1
          )
        );

        CREATE POLICY "Allow authenticated users to delete their files"
        ON storage.objects FOR DELETE TO authenticated
        USING (
          bucket_id = (SELECT id FROM storage.buckets WHERE name = 'pdfs')
          AND (
            auth.uid() = owner
            OR position(auth.uid()::text || '/' in name) = 1
          )
        );

        -- Create user folders (not needed anymore since we're using direct paths)
      `
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting up storage:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 