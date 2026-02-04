// File: src/components/interactions/CreatePostModal/CreatePostModal.tsx
// ============================================================================

'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { createPostWithGating } from '@/lib/supabase/actions';
import styles from './CreatePostModal.module.scss';

interface PostData {
  id: string;
  author: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  content: string;
  isGated: boolean;
  gates: Array<{
    ruleType: string;
    tokenAddress: string;
    chain: string;
    minimumBalance?: number;
    requiredTier?: string;
  }>;
  images?: string[];
  signalCount: number;
  echoCount: number;
  relayCount: number;
  createdAt: string;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost?: (newPost: PostData) => void;
}

interface ImageAttachment {
  url: string;
  alt?: string;
}

export function CreatePostModal({ isOpen, onClose, onPost }: CreatePostModalProps) {
  const { user } = useAuthStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Content state
  const [content, setContent] = useState('');
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState('');

  // Gating state
  const [isGated, setIsGated] = useState(false);
  const [showGatingOptions, setShowGatingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gating parameters
  const [ruleType, setRuleType] = useState<'token_ownership' | 'minimum_balance' | 'holder_tier' | 'time_held' | 'leaderboard'>('token_ownership');
  const [tokenAddress, setTokenAddress] = useState('');
  const chain = 'solana' as const;
  const [minimumBalance, setMinimumBalance] = useState('');
  const [requiredTier, setRequiredTier] = useState<'holder' | 'whale' | 'elite'>('holder');
  const [minHoldingDays, setMinHoldingDays] = useState('');
  const [leaderboardPosition, setLeaderboardPosition] = useState<'top10' | 'top50' | 'top100'>('top100');

  const charCount = content.length;
  const maxChars = 500;
  const isOverLimit = charCount > maxChars;

  // Insert text at cursor position
  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + text + content.substring(end);

    if (newContent.length <= maxChars) {
      setContent(newContent);
      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
      }, 0);
    }
  };

  // Handle mention insertion
  const insertMention = () => {
    insertAtCursor('@');
  };

  // Handle hashtag/community insertion
  const insertHashtag = () => {
    insertAtCursor('#');
  };

  // Validate and add image URL
  const handleAddImage = () => {
    if (!imageUrl.trim()) {
      setImageError('Please enter an image URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(imageUrl);
    } catch {
      setImageError('Please enter a valid URL');
      return;
    }

    // Check if URL looks like an image
    const isImageUrl = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(imageUrl) ||
                       imageUrl.includes('imgur') ||
                       imageUrl.includes('giphy') ||
                       imageUrl.includes('cloudinary') ||
                       imageUrl.includes('unsplash');

    if (!isImageUrl) {
      setImageError('URL should point to an image file');
      return;
    }

    if (images.length >= 4) {
      setImageError('Maximum 4 images allowed');
      return;
    }

    setImages([...images, { url: imageUrl.trim() }]);
    setImageUrl('');
    setImageError('');
    setShowImageInput(false);
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Handle content change with auto-linking
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= maxChars) {
      setContent(newContent);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || !user || isOverLimit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const gates = isGated && tokenAddress ? [{
        ruleType,
        tokenAddress,
        chain,
        minimumBalance: minimumBalance ? parseFloat(minimumBalance) : undefined,
        requiredTier: ruleType === 'holder_tier' ? requiredTier : undefined,
        minHoldingDays: ruleType === 'time_held' && minHoldingDays ? parseInt(minHoldingDays) : undefined,
        leaderboardPosition: ruleType === 'leaderboard' ? leaderboardPosition : undefined,
      }] : undefined;

      // Combine content with image URLs in a structured way
      // For now, append image URLs as markdown-style links
      let finalContent = content.trim();
      if (images.length > 0) {
        const imageLinks = images.map(img => `![image](${img.url})`).join('\n');
        finalContent = `${finalContent}\n\n${imageLinks}`;
      }

      const createdPost = await createPostWithGating({
        authorId: user.id,
        content: finalContent,
        isGated,
        visibility: 'public',
        gates,
      });

      const optimisticPost = {
        id: createdPost.id || `temp-${Date.now()}`,
        author: {
          id: user.id,
          username: user.username,
          displayName: user.displayName || user.username,
          avatarUrl: user.avatarUrl,
        },
        content: finalContent,
        isGated,
        gates: gates || [],
        images: images.map(img => img.url),
        signalCount: 0,
        echoCount: 0,
        relayCount: 0,
        createdAt: new Date().toISOString(),
      };

      onPost?.(optimisticPost);
      handleReset();
      onClose();
    } catch (err) {
      console.error('Failed to create post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setContent('');
    setImages([]);
    setImageUrl('');
    setShowImageInput(false);
    setIsGated(false);
    setShowGatingOptions(false);
    setTokenAddress('');
    setMinimumBalance('');
    setRuleType('token_ownership');
    setMinHoldingDays('');
    setLeaderboardPosition('top100');
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className={styles.modal__header}>
              <h2 className={styles.modal__title}>New Broadcast</h2>
              <button className={styles.modal__close} onClick={handleClose}>×</button>
            </div>

            <div className={styles.modal__composer}>
              {user && (
                <div className={styles.modal__user}>
                  <Avatar src={user.avatarUrl} alt={user.username} size="md" />
                  <span className={styles.modal__username}>@{user.username}</span>
                </div>
              )}

              <textarea
                ref={textareaRef}
                className={styles.modal__textarea}
                placeholder="What's on your mind? Use @ to mention users, # for communities..."
                value={content}
                onChange={handleContentChange}
                rows={6}
                autoFocus
              />

              {/* Image Previews */}
              {images.length > 0 && (
                <div className={styles.modal__images}>
                  {images.map((img, index) => (
                    <div key={index} className={styles.modal__image_preview}>
                      <img src={img.url} alt={img.alt || 'Attached image'} />
                      <button
                        className={styles.modal__image_remove}
                        onClick={() => removeImage(index)}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Image URL Input */}
              <AnimatePresence>
                {showImageInput && (
                  <motion.div
                    className={styles.modal__image_input}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <input
                      type="url"
                      placeholder="Paste image URL (jpg, png, gif, webp)..."
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImageError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImage();
                        }
                      }}
                    />
                    <div className={styles.modal__image_input_actions}>
                      <Button variant="ghost" onClick={() => setShowImageInput(false)}>
                        Cancel
                      </Button>
                      <Button variant="primary" onClick={handleAddImage}>
                        Add
                      </Button>
                    </div>
                    {imageError && <p className={styles.modal__image_error}>{imageError}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toolbar */}
              <div className={styles.modal__toolbar}>
                <div className={styles.modal__toolbar_buttons}>
                  <button
                    type="button"
                    className={styles.modal__toolbar_btn}
                    onClick={() => setShowImageInput(!showImageInput)}
                    title="Add image"
                    disabled={images.length >= 4}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                    {images.length > 0 && <span className={styles.modal__toolbar_badge}>{images.length}</span>}
                  </button>

                  <button
                    type="button"
                    className={styles.modal__toolbar_btn}
                    onClick={insertMention}
                    title="Mention user (@)"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="4"/>
                      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
                    </svg>
                  </button>

                  <button
                    type="button"
                    className={styles.modal__toolbar_btn}
                    onClick={insertHashtag}
                    title="Tag community (#)"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="4" y1="9" x2="20" y2="9"/>
                      <line x1="4" y1="15" x2="20" y2="15"/>
                      <line x1="10" y1="3" x2="8" y2="21"/>
                      <line x1="16" y1="3" x2="14" y2="21"/>
                    </svg>
                  </button>
                </div>

                <span className={`${styles.modal__count} ${isOverLimit ? styles['modal__count--error'] : ''}`}>
                  {charCount}/{maxChars}
                </span>
              </div>

              {/* Gate Toggle */}
              <div className={styles.modal__options}>
                <label className={styles.modal__option}>
                  <input
                    type="checkbox"
                    checked={isGated}
                    onChange={(e) => {
                      setIsGated(e.target.checked);
                      setShowGatingOptions(e.target.checked);
                    }}
                  />
                  <span>Gate this post (require token ownership)</span>
                </label>
              </div>
            </div>

            {/* Gating Options */}
            <AnimatePresence>
              {showGatingOptions && (
                <motion.div
                  className={styles.gating}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <h3 className={styles.gating__title}>Access Requirements</h3>

                  <div className={styles.gating__field}>
                    <label className={styles.gating__label}>Rule Type</label>
                    <select
                      className={styles.gating__select}
                      value={ruleType}
                      onChange={(e) => setRuleType(e.target.value as 'token_ownership' | 'minimum_balance' | 'holder_tier' | 'time_held' | 'leaderboard')}
                    >
                      <option value="token_ownership">Token Ownership (any amount)</option>
                      <option value="minimum_balance">Minimum Balance</option>
                      <option value="holder_tier">Holder Tier</option>
                      <option value="time_held">Time Held (Diamond Hands)</option>
                      <option value="leaderboard">Leaderboard Position</option>
                    </select>
                  </div>

                  <div className={styles.gating__field}>
                    <label className={styles.gating__label}>Blockchain</label>
                    <div className={styles.gating__static}>Solana</div>
                  </div>

                  <div className={styles.gating__field}>
                    <label className={styles.gating__label}>Token Address *</label>
                    <input
                      type="text"
                      className={styles.gating__input}
                      placeholder="Enter Solana token address..."
                      value={tokenAddress}
                      onChange={(e) => setTokenAddress(e.target.value)}
                    />
                  </div>

                  {ruleType === 'minimum_balance' && (
                    <div className={styles.gating__field}>
                      <label className={styles.gating__label}>Minimum Balance</label>
                      <input
                        type="number"
                        className={styles.gating__input}
                        placeholder="e.g., 1000"
                        value={minimumBalance}
                        onChange={(e) => setMinimumBalance(e.target.value)}
                      />
                    </div>
                  )}

                  {ruleType === 'holder_tier' && (
                    <div className={styles.gating__field}>
                      <label className={styles.gating__label}>Required Tier</label>
                      <select
                        className={styles.gating__select}
                        value={requiredTier}
                        onChange={(e) => setRequiredTier(e.target.value as 'holder' | 'whale' | 'elite')}
                      >
                        <option value="holder">Holder (any amount)</option>
                        <option value="whale">Whale (top 100 holders)</option>
                        <option value="elite">Elite (top 10 holders)</option>
                      </select>
                    </div>
                  )}

                  {ruleType === 'time_held' && (
                    <div className={styles.gating__field}>
                      <label className={styles.gating__label}>Minimum Days Held</label>
                      <input
                        type="number"
                        className={styles.gating__input}
                        placeholder="e.g., 30 (days)"
                        value={minHoldingDays}
                        onChange={(e) => setMinHoldingDays(e.target.value)}
                        min="1"
                      />
                      <p className={styles.gating__hint}>Reward diamond hands - users must have held the token for this many days</p>
                    </div>
                  )}

                  {ruleType === 'leaderboard' && (
                    <div className={styles.gating__field}>
                      <label className={styles.gating__label}>Leaderboard Position</label>
                      <select
                        className={styles.gating__select}
                        value={leaderboardPosition}
                        onChange={(e) => setLeaderboardPosition(e.target.value as 'top10' | 'top50' | 'top100')}
                      >
                        <option value="top100">Top 100 Holders</option>
                        <option value="top50">Top 50 Holders</option>
                        <option value="top10">Top 10 Holders</option>
                      </select>
                      <p className={styles.gating__hint}>Only users ranked on the holder leaderboard can access</p>
                    </div>
                  )}

                  <div className={styles.gating__info}>
                    <span className={styles.gating__info_icon}>i</span>
                    <p className={styles.gating__info_text}>
                      {ruleType === 'token_ownership' && 'Users must own any amount of this token to view.'}
                      {ruleType === 'minimum_balance' && 'Users must hold at least the specified amount.'}
                      {ruleType === 'holder_tier' && 'Users must be in the specified holder tier.'}
                      {ruleType === 'time_held' && 'Users must have held the token for the specified duration.'}
                      {ruleType === 'leaderboard' && 'Only top holders on the leaderboard can access.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            {error && (
              <div className={styles.modal__error}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div className={styles.modal__actions}>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!content.trim() || isOverLimit || (isGated && !tokenAddress) || isSubmitting}
                isLoading={isSubmitting}
              >
                Broadcast
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
