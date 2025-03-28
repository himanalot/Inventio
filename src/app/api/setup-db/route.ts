import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// This API route is used to set up the database schema
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Create collections table for organizing PDFs
    let collectionsError = null;
    try {
      await supabase.from('pdf_collections').select('count').limit(1);
    } catch (error) {
      const result = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.pdf_collections (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          
          ALTER TABLE public.pdf_collections ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Users can view their own collections" 
            ON public.pdf_collections 
            FOR SELECT 
            USING (auth.uid() = user_id);
          
          CREATE POLICY "Users can create their own collections" 
            ON public.pdf_collections 
            FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
          
          CREATE POLICY "Users can update their own collections" 
            ON public.pdf_collections 
            FOR UPDATE 
            USING (auth.uid() = user_id);
          
          CREATE POLICY "Users can delete their own collections" 
            ON public.pdf_collections 
            FOR DELETE 
            USING (auth.uid() = user_id);

          -- Create function to handle storage policy creation
          CREATE OR REPLACE FUNCTION create_storage_policy(
            bucket_name TEXT,
            policy_name TEXT,
            definition JSONB
          ) RETURNS VOID AS $$
          DECLARE
            policy_id UUID;
          BEGIN
            -- Create the policy
            INSERT INTO storage.policies (name, bucket_id, definition)
            SELECT 
              policy_name,
              id,
              definition::jsonb
            FROM storage.buckets
            WHERE name = bucket_name
            RETURNING id INTO policy_id;
            
            -- Grant access to authenticated users
            INSERT INTO storage.objects (bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata)
            VALUES (
              (SELECT id FROM storage.buckets WHERE name = bucket_name),
              'uploads/',
              auth.uid(),
              NOW(),
              NOW(),
              NOW(),
              '{}'::jsonb
            );
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      });
      collectionsError = result.error;
    }

    // Create user_documents table with collection support
    let documentsError = null;
    try {
      await supabase.from('user_documents').select('count').limit(1);
    } catch (error) {
      const result = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.user_documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) NOT NULL,
            collection_id UUID REFERENCES public.pdf_collections(id),
            filename TEXT NOT NULL,
            display_name TEXT,
            file_path TEXT NOT NULL,
            file_size BIGINT NOT NULL,
            file_type TEXT NOT NULL,
            description TEXT,
            tags TEXT[],
            uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            last_viewed_at TIMESTAMP WITH TIME ZONE,
            view_count INTEGER DEFAULT 0
          );
          
          ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Users can view their own documents" 
            ON public.user_documents 
            FOR SELECT 
            USING (auth.uid() = user_id);
          
          CREATE POLICY "Users can insert their own documents" 
            ON public.user_documents 
            FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
          
          CREATE POLICY "Users can update their own documents" 
            ON public.user_documents 
            FOR UPDATE 
            USING (auth.uid() = user_id);
          
          CREATE POLICY "Users can delete their own documents" 
            ON public.user_documents 
            FOR DELETE 
            USING (auth.uid() = user_id);
            
          -- Create indexes for better performance
          CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON public.user_documents(user_id);
          CREATE INDEX IF NOT EXISTS idx_user_documents_collection_id ON public.user_documents(collection_id);
          CREATE INDEX IF NOT EXISTS idx_user_documents_tags ON public.user_documents USING GIN(tags);
        `
      });
      documentsError = result.error;
    }

    return NextResponse.json({ 
      success: true, 
      errors: { 
        collections: collectionsError,
        documents: documentsError 
      }
    })
  } catch (error) {
    console.error('Error setting up database:', error)
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
} 