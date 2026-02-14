// File: src/components/feed/Comments/Comments.tsx
// Facebook-style comments with likes and replies
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { useAuthStore } from '@/store/auth.store';
import {
  getPostEchoes,
  getEchoReplies,
  createEcho,
  createEchoReply,
  likeEcho,
  Echo,
} from '@/lib/supabase/actions';
import styles from './Comments.module.scss';

interface CommentsProps {
  postId: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function Comments({ postId, isExpanded = false, onToggle }: CommentsProps) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Echo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [repliesMap, setRepliesMap] = useState<Record<string, Echo[]>>({});

  useEffect(() => {
    if (isExpanded) {
      loadComments();
    }
  }, [isExpanded, postId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const data = await getPostEchoes(postId, user?.id);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const echo = await createEcho({
        postId,
        authorId: user.id,
        content: newComment.trim(),
      });
      setComments(prev => [...prev, {
        ...echo,
        like_count: 0,
        reply_count: 0,
        has_liked: false,
      }]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentEchoId: string) => {
    if (!user || !replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const reply = await createEchoReply({
        postId,
        parentEchoId,
        authorId: user.id,
        content: replyContent.trim(),
      });

      // Add reply to replies map
      setRepliesMap(prev => ({
        ...prev,
        [parentEchoId]: [...(prev[parentEchoId] || []), reply],
      }));

      // Update reply count on parent
      setComments(prev => prev.map(c =>
        c.id === parentEchoId
          ? { ...c, reply_count: c.reply_count + 1 }
          : c
      ));

      setReplyContent('');
      setReplyingTo(null);

      // Expand replies if not already
      setExpandedReplies(prev => new Set(prev).add(parentEchoId));
    } catch (error) {
      console.error('Failed to create reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (echoId: string, isReply = false, parentId?: string) => {
    if (!user) return;

    try {
      const result = await likeEcho(user.id, echoId);

      if (isReply && parentId) {
        setRepliesMap(prev => ({
          ...prev,
          [parentId]: (prev[parentId] || []).map(r =>
            r.id === echoId
              ? {
                  ...r,
                  like_count: result.liked ? r.like_count + 1 : r.like_count - 1,
                  has_liked: result.liked,
                }
              : r
          ),
        }));
      } else {
        setComments(prev => prev.map(c =>
          c.id === echoId
            ? {
                ...c,
                like_count: result.liked ? c.like_count + 1 : c.like_count - 1,
                has_liked: result.liked,
              }
            : c
        ));
      }
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const toggleReplies = async (echoId: string) => {
    if (expandedReplies.has(echoId)) {
      setExpandedReplies(prev => {
        const next = new Set(prev);
        next.delete(echoId);
        return next;
      });
    } else {
      // Load replies if not already loaded
      if (!repliesMap[echoId]) {
        try {
          const replies = await getEchoReplies(echoId, user?.id);
          setRepliesMap(prev => ({ ...prev, [echoId]: replies }));
        } catch (error) {
          console.error('Failed to load replies:', error);
        }
      }
      setExpandedReplies(prev => new Set(prev).add(echoId));
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <motion.div
      className={styles.comments}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      {/* Comment Input */}
      {user && (
        <form className={styles.comments__composer} onSubmit={handleSubmitComment}>
          <Avatar src={user.avatarUrl} alt={user.username} size="sm" />
          <div className={styles.comments__input_wrapper}>
            <input
              type="text"
              className={styles.comments__input}
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isSubmitting}
            />
            {newComment.trim() && (
              <button
                type="submit"
                className={styles.comments__send}
                disabled={isSubmitting}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            )}
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className={styles.comments__list}>
        {isLoading ? (
          <div className={styles.comments__loading}>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className={styles.comments__empty}>
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                className={styles.comment}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Avatar
                  src={comment.author?.avatar_url}
                  alt={comment.author?.username || 'User'}
                  size="sm"
                />
                <div className={styles.comment__content}>
                  <div className={styles.comment__bubble}>
                    <span className={styles.comment__author}>
                      {comment.author?.display_name || comment.author?.username}
                    </span>
                    <p className={styles.comment__text}>{comment.content}</p>
                  </div>

                  <div className={styles.comment__actions}>
                    <button
                      className={`${styles.comment__action} ${comment.has_liked ? styles['comment__action--active'] : ''}`}
                      onClick={() => handleLike(comment.id)}
                    >
                      {comment.has_liked ? 'Liked' : 'Like'}
                    </button>
                    <button
                      className={styles.comment__action}
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    >
                      Reply
                    </button>
                    <span className={styles.comment__time}>
                      {formatTimeAgo(comment.created_at)}
                    </span>
                    {comment.like_count > 0 && (
                      <span className={styles.comment__likes}>
                        ❤️ {comment.like_count}
                      </span>
                    )}
                  </div>

                  {/* Reply Input */}
                  <AnimatePresence>
                    {replyingTo === comment.id && user && (
                      <motion.div
                        className={styles.comment__reply_composer}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Avatar src={user.avatarUrl} alt={user.username} size="sm" />
                        <div className={styles.comments__input_wrapper}>
                          <input
                            type="text"
                            className={styles.comments__input}
                            placeholder={`Reply to ${comment.author?.display_name || comment.author?.username}...`}
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmitReply(comment.id);
                              }
                            }}
                            autoFocus
                          />
                          {replyContent.trim() && (
                            <button
                              type="button"
                              className={styles.comments__send}
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={isSubmitting}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* View Replies */}
                  {comment.reply_count > 0 && (
                    <button
                      className={styles.comment__view_replies}
                      onClick={() => toggleReplies(comment.id)}
                    >
                      {expandedReplies.has(comment.id)
                        ? 'Hide replies'
                        : `View ${comment.reply_count} ${comment.reply_count === 1 ? 'reply' : 'replies'}`}
                    </button>
                  )}

                  {/* Replies */}
                  <AnimatePresence>
                    {expandedReplies.has(comment.id) && repliesMap[comment.id] && (
                      <motion.div
                        className={styles.comment__replies}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {repliesMap[comment.id].map((reply) => (
                          <div key={reply.id} className={styles.reply}>
                            <Avatar
                              src={reply.author?.avatar_url}
                              alt={reply.author?.username || 'User'}
                              size="sm"
                            />
                            <div className={styles.comment__content}>
                              <div className={styles.comment__bubble}>
                                <span className={styles.comment__author}>
                                  {reply.author?.display_name || reply.author?.username}
                                </span>
                                <p className={styles.comment__text}>{reply.content}</p>
                              </div>
                              <div className={styles.comment__actions}>
                                <button
                                  className={`${styles.comment__action} ${reply.has_liked ? styles['comment__action--active'] : ''}`}
                                  onClick={() => handleLike(reply.id, true, comment.id)}
                                >
                                  {reply.has_liked ? 'Liked' : 'Like'}
                                </button>
                                <span className={styles.comment__time}>
                                  {formatTimeAgo(reply.created_at)}
                                </span>
                                {reply.like_count > 0 && (
                                  <span className={styles.comment__likes}>
                                    ❤️ {reply.like_count}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
