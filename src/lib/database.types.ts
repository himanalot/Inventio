export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_conversations: {
        Row: {
          id: string
          user_id: string
          document_url: string
          document_name: string
          title: string
          created_at: string
          updated_at: string
          document_path: string
          summary: string | null
          suggested_questions: string | null
          quick_actions: string | null
        }
        Insert: {
          id?: string
          user_id: string
          document_url: string
          document_name: string
          title: string
          created_at?: string
          updated_at?: string
          document_path?: string
          summary?: string | null
          suggested_questions?: string | null
          quick_actions?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          document_url?: string
          document_name?: string
          title?: string
          created_at?: string
          updated_at?: string
          document_path?: string
          summary?: string | null
          suggested_questions?: string | null
          quick_actions?: string | null
        }
      }
      chat_messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          created_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          conversation_id: string
          role: string
          content: string
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          content?: string
          created_at?: string
          metadata?: Json | null
        }
      }
      document_chunks: {
        Row: {
          id: string
          user_id: string
          document_path: string
          document_name: string
          text: string
          page_number: number
          chunk_index: number
          chunk_size: number
          metadata: Json
          embedding: number[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_path: string
          document_name: string
          text: string
          page_number: number
          chunk_index: number
          chunk_size: number
          metadata: Json
          embedding: number[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_path?: string
          document_name?: string
          text?: string
          page_number?: number
          chunk_index?: number
          chunk_size?: number
          metadata?: Json
          embedding?: number[]
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          tutor_id: string
          student_id: string | null
          subject: string
          title: string
          description: string | null
          date: string
          start_time: string
          end_time: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          location: string | null
          is_online: boolean
          hourly_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          student_id?: string | null
          subject: string
          title: string
          description?: string | null
          date: string
          start_time: string
          end_time: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          location?: string | null
          is_online?: boolean
          hourly_rate: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tutor_id?: string
          student_id?: string | null
          subject?: string
          title?: string
          description?: string | null
          date?: string
          start_time?: string
          end_time?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          location?: string | null
          is_online?: boolean
          hourly_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      tutor_subjects: {
        Row: {
          tutor_id: string
          subject_id: string
          created_at: string
        }
        Insert: {
          tutor_id: string
          subject_id: string
          created_at?: string
        }
        Update: {
          tutor_id?: string
          subject_id?: string
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          session_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          reviewer_id?: string
          reviewee_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      saved_sessions: {
        Row: {
          user_id: string
          session_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          session_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          session_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
          user_id_input: string
        }
        Returns: {
          id: string
          document_path: string
          document_name: string
          page_number: number
          chunk_index: number
          text: string
          metadata: Json
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 