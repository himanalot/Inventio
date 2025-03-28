'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChatConversation, getChatMessages, saveChatMessage } from '@/lib/chat-service';
import { Textarea } from '@/components/ui/textarea';
import { Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '@/types/chat';

// Hardcoded quick actions that will always be used regardless of what's in Supabase
const QUICK_ACTIONS = ['breakdown', 'practice questions', 'study guide'];

// Map of quick actions to their detailed prompts
const QUICK_ACTION_PROMPTS: Record<string, string> = {
  'breakdown': 'Please provide a detailed breakdown of the key points in this document.',
  'practice questions': 'Generate some practice questions based on this document to test my understanding.',
  'study guide': 'Create a comprehensive study guide for this document that covers all the important concepts.'
};

interface ChatPanelProps {
  conversation: ChatConversation | null;
  onClose?: () => void;
  onCitationClick?: (position: any) => void;
}

export default function ChatPanel({ conversation, onClose, onCitationClick }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Add state for expanded summary
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  // Add loading state for summary card
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  
  // Default quick actions if none are provided
  // const defaultQuickActions = ['breakdown', 'practice questions', 'study guide'];
  
  // Load initial messages
  useEffect(() => {
    if (!conversation) return;
    
    const loadMessages = async () => {
      setIsLoading(true);
      setIsSummaryLoading(true); // Set summary loading state
      try {
        const chatMessages = await getChatMessages(conversation.id);
        setMessages(chatMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoading(false);
        // Simulate a slight delay before showing the summary to ensure smooth transition
        setTimeout(() => setIsSummaryLoading(false), 600);
      }
    };
    
    loadMessages();
  }, [conversation]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversation) return;
    
    // Create user message
    const userMessage: ChatMessage = {
      id: 'temp-user-' + Date.now(),
      conversation_id: conversation.id,
      role: 'user',
      content: inputMessage,
      created_at: new Date().toISOString()
    };
    
    // Add to UI immediately
    setMessages(prev => [...prev, userMessage]);
    
    // Show loading state
    setIsLoading(true);
    setInputMessage('');
    
    try {
      // Save the message to the database
      const savedUserMessage = await saveChatMessage(
        conversation.id,
        'user',
        inputMessage
      );
      
      // Create assistant loading message
      const loadingMessage: ChatMessage = {
        id: 'temp-assistant-' + Date.now(),
        conversation_id: conversation.id,
        role: 'assistant',
        content: '...',
        created_at: new Date().toISOString()
      };
      
      // Add to UI
      setMessages(prev => [...prev.filter(m => m.id !== userMessage.id), savedUserMessage || userMessage, loadingMessage]);
      
      // Send the message to the assistant via the chat API
      const assistantMessage = await saveChatMessage(
        conversation.id,
        'assistant',
        `I'll analyze this document based on your input. One moment please...`
      );
      
      // Replace loading message with actual response
      setMessages(prev => [
        ...prev.filter(m => m.id !== loadingMessage.id), 
        assistantMessage || {
          id: 'fallback-assistant-' + Date.now(),
          conversation_id: conversation.id,
          role: 'assistant',
          content: 'I can help you understand this document. What would you like to know?',
          created_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error message
      setMessages(prev => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          conversation_id: conversation.id,
          role: 'assistant',
          content: 'Sorry, there was an error processing your message. Please try again.',
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleQuestionClick = (question: string) => {
    // Check if this is a quick action that needs to be expanded to a full prompt
    if (QUICK_ACTIONS.includes(question)) {
      setInputMessage(QUICK_ACTION_PROMPTS[question] || question);
    } else {
      // For suggested questions, use as-is
      setInputMessage(question);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send message on Enter (without shift for newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // If no conversation is selected, show placeholder
  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Sparkles className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium mb-2">AI Document Chat</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Select a document to start a conversation with Gemini AI about its contents.
        </p>
      </div>
    );
  }
  
  // Always use the hardcoded quick actions defined at the top of the file
  const quickActions = QUICK_ACTIONS;
  
  return (
    <div className="flex flex-col h-full bg-background max-h-full">
      {/* Messages Area with Close Button */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative min-h-0">
        {/* Close button removed as it's now handled by the sparkle button */}
        
        {/* Summary Card - Always shown at the top */}
        {conversation.summary && typeof conversation.summary === 'string' && conversation.summary.trim() && (
          <div className="bg-background shadow-feint rounded-xl border border-border">
            <div className="pb-4">
              <h2 className="pt-4 pl-5 text-xs font-semibold text-textGray5 mb-[2px]">Summary</h2>
              <div className="relative group mx-3 p-2 hover:bg-muted cursor-pointer rounded-md"
                   onClick={() => !isSummaryLoading && setIsSummaryExpanded(!isSummaryExpanded)}>
                {isSummaryLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ) : (
                  <p className="text-sm font-medium leading-[19px] border-none resize-none">
                    {!isSummaryExpanded && conversation.summary && conversation.summary.length > 350
                      ? conversation.summary.substring(0, 350) + '...'
                      : conversation.summary}
                  </p>
                )}
                {!isSummaryLoading && !isSummaryExpanded && conversation.summary && conversation.summary.length > 350 && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-end justify-end p-2 transition-opacity">
                    <span className="bg-gray-100 text-gray-800 rounded-md px-2 py-1 text-xs font-medium">
                      Show all
                    </span>
                  </div>
                )}
                {!isSummaryLoading && isSummaryExpanded && conversation.summary && conversation.summary.length > 350 && (
                  <div className="flex justify-end mt-2">
                    <span 
                      className="bg-gray-100 text-gray-800 rounded-md px-2 py-1 text-xs font-medium cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSummaryExpanded(false);
                      }}
                    >
                      Show less
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex p-1 pt-0 gap-1 flex-row">
              <div className="w-1/3">
                <h2 className="pl-4 text-xs font-semibold text-textGray5 mb-2">Quick actions</h2>
                {isSummaryLoading ? (
                  <div className="space-y-2 px-4">
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  quickActions.map((action, index) => (
                    <button 
                      key={index}
                      className="text-sm pl-4 disabled:opacity-50 first-letter:uppercase font-medium w-full text-left leading-[19px] p-[10px] rounded-lg hover:bg-muted transition-colors"
                      onClick={() => handleQuestionClick(action)}
                    >
                      {action}
                    </button>
                  ))
                )}
              </div>
              <div className="w-2/3">
                <h2 className="text-xs font-semibold text-textGray5 mb-2 pl-4">Suggested questions</h2>
                {isSummaryLoading ? (
                  <div className="space-y-2 px-4">
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  (() => {
                    // Make sure suggested_questions is an array
                    let suggestedQuestions: string[] = [];
                    if (conversation.suggested_questions) {
                      // Handle both string JSON and already parsed arrays
                      if (typeof conversation.suggested_questions === 'string') {
                        try {
                          suggestedQuestions = JSON.parse(conversation.suggested_questions);
                        } catch (e) {
                          console.error('Error parsing suggested_questions:', e);
                        }
                      } else if (Array.isArray(conversation.suggested_questions)) {
                        suggestedQuestions = conversation.suggested_questions;
                      }
                    }
                    
                    return suggestedQuestions.map((question, index) => (
                      <button 
                        key={index}
                        className="text-sm leading-[19px] disabled:opacity-50 pl-4 font-medium w-full text-left hover:bg-muted p-[10px] rounded-lg transition-colors"
                        onClick={() => handleQuestionClick(question)}
                      >
                        {question}
                      </button>
                    ));
                  })()
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Chat Messages */}
        {messages.map((message, index) => (
          <div key={message.id} className="mb-4">
            {message.role === 'assistant' && (
              <div className={`flex justify-start`}>
                <div className={`ml-10 text-gray-500 text-[10px] font-medium mb-1 text-left`}>
                  Inventio
                </div>
              </div>
            )}
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <div className="flex items-start mr-2">
                  <div className="w-8 h-8 rounded-full bg-black"></div>
                </div>
              )}
              <div 
                className={`max-w-[85%] rounded-lg px-5 py-3 ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-tr-none'
                    : 'bg-white dark:bg-gray-800 rounded-tl-none border border-border/40 dark:border-gray-700'
                }`}
              >
                {message.content === '...' ? (
                  <div className="flex items-center space-x-1 px-2 py-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                ) : message.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mb-2 prose-headings:mt-1 prose-p:mb-1 prose-p:mt-1">
                    <ReactMarkdown>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {message.content.split('\n').map((line: string, i: number) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < message.content.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                )}
                {/* We would handle citation clicks here if the message contains them */}
                {message.citations && message.citations.length > 0 && onCitationClick && (
                  <div className="mt-2 text-xs">
                    <button 
                      className="text-blue-500 hover:text-blue-700 underline"
                      onClick={() => {
                        if (message.citations && message.citations.length > 0 && onCitationClick) {
                          onCitationClick(message.citations[0].position);
                        }
                      }}
                    >
                      View citation
                    </button>
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="flex items-start ml-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 via-pink-400 to-white"></div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area - Fixed at bottom */}
      <div className="border-t p-4 bg-background flex-shrink-0">
        <div className="flex items-end gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about or interact with this document..."
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="h-10 w-10 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 