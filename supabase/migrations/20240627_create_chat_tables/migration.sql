-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_url TEXT NOT NULL,
  document_path TEXT NOT NULL,
  document_name TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  suggested_questions JSONB,
  quick_actions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS chat_conversations_user_id_idx ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS chat_conversations_document_path_idx ON chat_conversations(document_path);
CREATE INDEX IF NOT EXISTS chat_conversations_updated_at_idx ON chat_conversations(updated_at DESC);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Add indexes for messages
CREATE INDEX IF NOT EXISTS chat_messages_conversation_id_idx ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);

-- Set up Row Level Security (RLS) for chat_conversations
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own conversations
CREATE POLICY chat_conversations_select_policy ON chat_conversations
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own conversations
CREATE POLICY chat_conversations_insert_policy ON chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own conversations
CREATE POLICY chat_conversations_update_policy ON chat_conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own conversations
CREATE POLICY chat_conversations_delete_policy ON chat_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Set up Row Level Security (RLS) for chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view messages in their own conversations
CREATE POLICY chat_messages_select_policy ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
        AND chat_conversations.user_id = auth.uid()
    )
  );

-- Policy: Users can only insert messages in their own conversations
CREATE POLICY chat_messages_insert_policy ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
        AND chat_conversations.user_id = auth.uid()
    )
  );

-- Policy: Users can only update messages in their own conversations
CREATE POLICY chat_messages_update_policy ON chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
        AND chat_conversations.user_id = auth.uid()
    )
  );

-- Policy: Users can only delete messages in their own conversations
CREATE POLICY chat_messages_delete_policy ON chat_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
        AND chat_conversations.user_id = auth.uid()
    )
  ); 