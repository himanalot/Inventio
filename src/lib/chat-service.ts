import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { processDocumentQuery } from './chatbot-service';
import { ChatMessage, ChatRole } from '../types/chat';

export interface ChatConversation {
  id: string;
  user_id: string;
  document_url: string;
  document_path: string;
  document_name: string;
  title: string;
  created_at: string;
  updated_at: string;
  summary?: string;
  suggested_questions?: string[];
  quick_actions?: string[];
  messages?: ChatMessage[];
}

// Check if tables exist before trying to access them
async function ensureTablesExist() {
  try {
    // Check if chat_conversations table exists
    const { error: convError } = await supabase
      .from('chat_conversations')
      .select('id')
      .limit(1);
    
    // Check if chat_messages table exists
    const { error: msgError } = await supabase
      .from('chat_messages')
      .select('id')
      .limit(1);
    
    // If either table doesn't exist, log error but don't throw
    if (convError || msgError) {
      console.error('Chat tables may not exist:', { convError, msgError });
      console.log('Please run the SQL migration in supabase/migrations/20240610_create_chat_tables/migration.sql');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking tables:', error);
    return false;
  }
}

/**
 * Creates a new chat conversation in the database
 */
export async function createChatConversation(
  userId: string,
  documentUrl: string,
  documentName: string,
  title: string,
  documentPath?: string,
  summary?: string,
  suggestedQuestions?: string[],
  quickActions?: string[],
  metadata?: Record<string, any>
): Promise<ChatConversation | null> {
  try {
    // Check if tables exist
    const tablesExist = await ensureTablesExist();
    if (!tablesExist) {
      console.error('Cannot create conversation: tables do not exist');
      return null;
    }
    
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Extract path from URL if not provided
    // This is a fallback mechanism for backward compatibility
    const finalDocumentPath = documentPath || documentUrl.split('?')[0]; // Remove query parameters to get a more stable identifier
    
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        id,
        user_id: userId,
        document_url: documentUrl,
        document_path: finalDocumentPath, // Store the stable path
        document_name: documentName,
        title: title || 'Conversation about ' + documentName,
        created_at: now,
        updated_at: now,
        summary: summary,
        suggested_questions: suggestedQuestions ? JSON.stringify(suggestedQuestions) : null,
        quick_actions: quickActions ? JSON.stringify(quickActions) : null,
        metadata: metadata || null
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating chat conversation:', error);
      return null;
    }
    
    // Parse JSON fields if they exist
    if (data) {
      try {
        if (data.suggested_questions) {
          data.suggested_questions = JSON.parse(data.suggested_questions);
        }
        if (data.quick_actions) {
          data.quick_actions = JSON.parse(data.quick_actions);
        }
      } catch (parseError) {
        console.error('Error parsing JSON fields:', parseError);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error in createChatConversation:', error);
    return null;
  }
}

/**
 * Saves a chat message to the database and processes AI responses
 */
export async function saveChatMessage(
  conversationId: string,
  role: ChatRole,
  content: string,
  citations?: {text: string; position: any}[]
): Promise<ChatMessage | null> {
  try {
    // Check if tables exist
    const tablesExist = await ensureTablesExist();
    if (!tablesExist) {
      console.error('Cannot save message: tables do not exist');
      return null;
    }
    
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // If this is a user message, save it directly
    if (role === 'user') {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          id,
          conversation_id: conversationId,
          role,
          content,
          created_at: now
        })
        .select('*')
        .single();
      
      if (error) {
        console.error('Error saving chat message:', error);
        return null;
      }
      
      // Also update the conversation's updated_at time
      await supabase
        .from('chat_conversations')
        .update({ updated_at: now })
        .eq('id', conversationId);
      
      return data;
    }
    
    // If this is an assistant message, we need to get the conversation and document info
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    
    if (convError) {
      console.error('Error fetching conversation for AI response:', convError);
      return null;
    }
    
    // Get the conversation history for context
    const { data: recentMessages, error: msgError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true }) // Get messages in chronological order
      .limit(10); // Get last 10 messages for context
    
    if (msgError) {
      console.error('Error fetching recent messages:', msgError);
      return null;
    }
    
    // Get the last user message and format conversation history
    const messages: ChatMessage[] = recentMessages || [];
    const lastUserMessage = messages
      .filter((msg: ChatMessage) => msg.role === 'user')
      .pop();
    
    if (!lastUserMessage) {
      console.error('No user message found to respond to');
      return null;
    }
    
    // Format conversation history to include citations and maintain context
    const formattedHistory = messages
      .filter((msg: ChatMessage) => msg.id !== lastUserMessage.id) // Exclude the last user message
      .map((msg: ChatMessage) => {
        if (msg.role === 'assistant' && msg.metadata?.citations) {
          // Include citation information in history
          const citationInfo = msg.metadata.citations
            .map((cite: any, idx: number) => `[${idx + 1}] Page ${cite.position.pageNumber}`)
            .join(', ');
          return `${msg.role}: ${msg.content}\nCitations: ${citationInfo}`;
        }
        return `${msg.role}: ${msg.content}`;
      })
      .join('\n\n');
    
    // Generate AI response using the document and user's input
    const response = await processDocumentQuery(
      conversation.document_path,
      lastUserMessage.content,
      formattedHistory ? [{ role: 'assistant' as const, content: formattedHistory }] : []
    );
    
    // Prepare metadata with citations if any
    let metadata = null;
    if (response.citations && response.citations.length > 0) {
      metadata = { citations: response.citations };
    }
    
    // Save the AI response
    const { data: savedMessage, error: saveError } = await supabase
      .from('chat_messages')
      .insert({
        id,
        conversation_id: conversationId,
        role: 'assistant' as const,
        content: response.text,
        created_at: now,
        metadata
      })
      .select('*')
      .single();
    
    if (saveError) {
      console.error('Error saving AI response:', saveError);
      return null;
    }
    
    // Update conversation's updated_at time
    await supabase
      .from('chat_conversations')
      .update({ updated_at: now })
      .eq('id', conversationId);
    
    return savedMessage;
  } catch (error) {
    console.error('Error in saveChatMessage:', error);
    return null;
  }
}

/**
 * Gets all messages for a specific conversation
 */
export async function getChatMessages(conversationId: string): Promise<ChatMessage[]> {
  try {
    // Check if tables exist
    const tablesExist = await ensureTablesExist();
    if (!tablesExist) {
      console.error('Cannot get messages: tables do not exist');
      return [];
    }
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
    
    // Process the messages to extract citations from metadata
    const messages = data.map(message => {
      // Extract citations from metadata if they exist
      const citations = message.metadata?.citations || undefined;
      
      return {
        ...message,
        citations
      };
    });
    
    return messages || [];
  } catch (error) {
    console.error('Error in getChatMessages:', error);
    return [];
  }
}

/**
 * Gets all chat conversations for a user
 */
export async function getUserChatConversations(userId: string): Promise<ChatConversation[]> {
  try {
    // Check if tables exist
    const tablesExist = await ensureTablesExist();
    if (!tablesExist) {
      console.error('Cannot get conversations: tables do not exist');
      return [];
    }
    
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user chat conversations:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getUserChatConversations:', error);
    return [];
  }
}

/**
 * Gets a specific chat conversation with all its messages
 */
export async function getConversationWithMessages(conversationId: string): Promise<ChatConversation | null> {
  try {
    // Check if tables exist
    const tablesExist = await ensureTablesExist();
    if (!tablesExist) {
      console.error('Cannot get conversation: tables do not exist');
      return null;
    }
    
    // First get the conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    
    if (conversationError || !conversation) {
      console.error('Error fetching conversation:', conversationError);
      return null;
    }
    
    // Parse JSON fields if they exist
    try {
      if (conversation.suggested_questions && typeof conversation.suggested_questions === 'string') {
        conversation.suggested_questions = JSON.parse(conversation.suggested_questions);
      }
      if (conversation.quick_actions && typeof conversation.quick_actions === 'string') {
        conversation.quick_actions = JSON.parse(conversation.quick_actions);
      }
    } catch (parseError) {
      console.error('Error parsing JSON fields in conversation:', parseError);
    }
    
    // Then get all messages for this conversation
    const messages = await getChatMessages(conversationId);
    
    // Return the conversation with messages
    return {
      ...conversation,
      messages
    };
  } catch (error) {
    console.error('Error in getConversationWithMessages:', error);
    return null;
  }
}

/**
 * Gets conversations for a specific document using path as the primary identifier
 */
export async function getDocumentConversations(
  userId: string, 
  documentUrl: string,
  documentPath?: string
): Promise<ChatConversation[]> {
  try {
    // Check if tables exist
    const tablesExist = await ensureTablesExist();
    if (!tablesExist) {
      console.error('Cannot get document conversations: tables do not exist');
      return [];
    }
    
    // First try to query by path if provided (more reliable)
    if (documentPath) {
      console.log("Querying conversations by document path:", documentPath);
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('document_path', documentPath)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching document conversations by path:', error);
      } else if (data && data.length > 0) {
        console.log(`Found ${data.length} conversations by document path`);
        return data;
      }
    }
    
    // Fallback to URL-based query if no path provided or no results found by path
    // This maintains backward compatibility
    console.log("Querying conversations by document URL:", documentUrl.substring(0, 50) + "...");
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('document_url', documentUrl)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching document conversations by URL:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getDocumentConversations:', error);
    return [];
  }
}

/**
 * Deletes a chat conversation and all its messages
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  try {
    // Check if tables exist
    const tablesExist = await ensureTablesExist();
    if (!tablesExist) {
      console.error('Cannot delete conversation: tables do not exist');
      return false;
    }
    
    // Delete all messages first (due to foreign key constraint)
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('conversation_id', conversationId);
    
    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      return false;
    }
    
    // Then delete the conversation
    const { error: conversationError } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId);
    
    if (conversationError) {
      console.error('Error deleting conversation:', conversationError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteConversation:', error);
    return false;
  }
}

/**
 * Updates a conversation with new summary, suggested questions, and quick actions
 */
export async function updateConversationMetadata(
  conversationId: string,
  updates: {
    summary?: string | null;
    suggestedQuestions?: string[];
    quickActions?: string[];
  }
): Promise<boolean> {
  try {
    // Check if tables exist
    const tablesExist = await ensureTablesExist();
    if (!tablesExist) {
      console.error('Cannot update conversation: tables do not exist');
      return false;
    }
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (updates.summary !== undefined) {
      updateData.summary = updates.summary;
    }
    
    if (updates.suggestedQuestions !== undefined) {
      updateData.suggested_questions = JSON.stringify(updates.suggestedQuestions);
    }
    
    if (updates.quickActions !== undefined) {
      updateData.quick_actions = JSON.stringify(updates.quickActions);
    }
    
    const { error } = await supabase
      .from('chat_conversations')
      .update(updateData)
      .eq('id', conversationId);
    
    if (error) {
      console.error('Error updating conversation metadata:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateConversationMetadata:', error);
    return false;
  }
} 