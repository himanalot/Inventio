# Supabase Database Setup for Chat Functionality

This folder contains migrations for setting up the Supabase database to support chat functionality in the application.

## Setting Up Chat Tables

To set up the chat tables in your Supabase instance, follow these steps:

### Option 1: Run SQL Migration in Supabase Dashboard

1. Log in to your Supabase dashboard (https://app.supabase.com/)
2. Navigate to your project and select "SQL Editor" from the left sidebar
3. Create a new query and paste the contents of `migrations/20240610_create_chat_tables/migration.sql`
4. Click "Run" to execute the SQL and create the tables
5. To add the document path column, create another query with the contents of `migrations/20240612_add_document_path/migration.sql`
6. Run this migration to update the schema with the stable document identifier

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

1. Make sure you're logged in:
   ```
   supabase login
   ```

2. Navigate to your project directory and run:
   ```
   supabase db push
   ```

## Database Schema

The chat functionality uses the following tables:

### chat_conversations

This table stores the top-level conversation information:

- `id`: UUID primary key
- `user_id`: The ID of the user who owns the conversation (references auth.users)
- `document_url`: The URL of the document being discussed
- `document_path`: A stable identifier for the document (not affected by URL changes)
- `document_name`: The name of the document
- `title`: The title of the conversation
- `created_at`: Timestamp when the conversation was created
- `updated_at`: Timestamp when the conversation was last updated

### chat_messages

This table stores individual messages in each conversation:

- `id`: UUID primary key
- `conversation_id`: The ID of the conversation this message belongs to
- `role`: The role of the message sender ('user', 'assistant', or 'system')
- `content`: The message content
- `created_at`: Timestamp when the message was created

## Row Level Security

The tables have Row Level Security (RLS) policies configured to ensure that:

1. Users can only access their own conversations
2. Users can only access messages in conversations they own

## Indexes

The following indexes have been created for performance:

- `idx_chat_conversations_user_id`: For quickly finding conversations by user
- `idx_chat_conversations_document_url`: For quickly finding conversations by document URL
- `idx_chat_conversations_document_path`: For quickly finding conversations by document path
- `idx_chat_messages_conversation_id`: For quickly finding messages in a conversation
- `idx_chat_messages_role`: For filtering messages by role 