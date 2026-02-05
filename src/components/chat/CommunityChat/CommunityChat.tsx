// File: src/components/chat/CommunityChat/CommunityChat.tsx
// ============================================================================

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner/LoadingSpinner';
import { useAuthStore } from '@/store/auth.store';
import {
  getCommunityChat,
  sendCommunityMessage,
  subscribeToCommunityChat,
  getCommunityThreadId,
  ChatMessage,
} from '@/lib/supabase/actions';
import styles from './CommunityChat.module.scss';

interface CommunityChatProps {
  communityId: string;
  communityName: string;
}

export function CommunityChat({ communityId, communityName }: CommunityChatProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load messages
  useEffect(() => {
    async function loadChat() {
      setIsLoading(true);
      setError(null);

      try {
        const chatMessages = await getCommunityChat(communityId);
        setMessages(chatMessages);

        const tid = await getCommunityThreadId(communityId);
        setThreadId(tid);
      } catch (err) {
        console.error('Error loading chat:', err);
        setError('Failed to load chat messages');
      } finally {
        setIsLoading(false);
      }
    }

    loadChat();
  }, [communityId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!threadId) return;

    const subscription = subscribeToCommunityChat(communityId, threadId, (message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [communityId, threadId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const message = await sendCommunityMessage(communityId, user.id, newMessage);
      // Message will be added via subscription, but add immediately for responsiveness
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
      setNewMessage('');
      inputRef.current?.focus();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, ChatMessage[]>);

  if (isLoading) {
    return (
      <div className={styles.chat__loading}>
        <LoadingSpinner variant="lock" size="md" />
        <p>Loading chat...</p>
      </div>
    );
  }

  return (
    <div className={styles.chat}>
      <div className={styles.chat__header}>
        <h3 className={styles.chat__title}>{communityName}</h3>
        <span className={styles.chat__member_count}>Community Chat</span>
      </div>

      <div className={styles.chat__messages}>
        {messages.length === 0 ? (
          <div className={styles.chat__empty}>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className={styles.chat__date_divider}>
                <span>{date}</span>
              </div>
              <AnimatePresence>
                {dateMessages.map((message, index) => {
                  const isOwn = message.sender_id === user?.id;
                  const showAvatar =
                    index === 0 ||
                    dateMessages[index - 1]?.sender_id !== message.sender_id;

                  return (
                    <motion.div
                      key={message.id}
                      className={`${styles.chat__message} ${isOwn ? styles['chat__message--own'] : ''}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {!isOwn && showAvatar && (
                        <Avatar
                          src={message.sender?.avatar_url}
                          alt={message.sender?.username || 'User'}
                          size="sm"
                        />
                      )}
                      {!isOwn && !showAvatar && (
                        <div className={styles.chat__avatar_spacer} />
                      )}
                      <div className={styles.chat__message_content}>
                        {showAvatar && !isOwn && (
                          <span className={styles.chat__sender_name}>
                            {message.sender?.display_name || message.sender?.username}
                          </span>
                        )}
                        <div className={styles.chat__bubble}>
                          <p>{message.content}</p>
                          <span className={styles.chat__time}>
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className={styles.chat__error}>
          {error}
        </div>
      )}

      <form className={styles.chat__composer} onSubmit={handleSend}>
        <textarea
          ref={inputRef}
          className={styles.chat__input}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={isSending}
        />
        <Button
          variant="primary"
          type="submit"
          disabled={!newMessage.trim() || isSending}
          isLoading={isSending}
        >
          Send
        </Button>
      </form>
    </div>
  );
}
