-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  document_name TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_document_url ON chat_conversations(document_url);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);

-- Enable Row Level Security
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only see their own conversations
CREATE POLICY "Users can only view their own conversations"
  ON chat_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own conversations
CREATE POLICY "Users can only insert their own conversations"
  ON chat_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own conversations
CREATE POLICY "Users can only update their own conversations"
  ON chat_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own conversations
CREATE POLICY "Users can only delete their own conversations"
  ON chat_conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Users can only view messages from their own conversations
CREATE POLICY "Users can only view messages from their own conversations"
  ON chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

-- Users can only insert messages to their own conversations
CREATE POLICY "Users can only insert messages to their own conversations"
  ON chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

-- Users can only delete messages from their own conversations
CREATE POLICY "Users can only delete messages from their own conversations"
  ON chat_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  ); 