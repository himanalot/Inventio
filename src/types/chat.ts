export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: ChatRole;
  content: string;
  created_at?: string;
  metadata?: {
    citations?: {
      text: string;
      position: {
        pageNumber: number;
        left: number;
        top: number;
        width: number;
        height: number;
      };
    }[];
  };
  citations?: {
    text: string;
    position: {
      pageNumber: number;
      left: number;
      top: number;
      width: number;
      height: number;
    };
  }[];
}

export interface ChatConversation {
  id: string;
  user_id: string;
  document_path: string;
  created_at: string;
  updated_at: string;
  title?: string;
  metadata?: Record<string, any>;
} 