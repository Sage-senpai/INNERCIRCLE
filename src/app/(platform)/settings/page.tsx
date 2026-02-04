// File: src/app/(platform)/settings/page.tsx
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button/Button';
import { updateUserProfile, checkUsernameAvailable } from '@/lib/supabase/actions';
import styles from './page.module.scss';

export default function SettingsPage() {
  const { user, logout, setUser } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  // Editing states
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [usernameError, setUsernameError] = useState('');
  const [bioError, setBioError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Sync state when user changes
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    window.location.href = '/connect';
  };

  // Validate username format
  const validateUsername = (value: string): string => {
    if (!value) return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 30) return 'Username must be 30 characters or less';
    if (!/^[A-Za-z0-9_]+$/.test(value)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return '';
  };

  // Handle username change
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setUsernameError(validateUsername(value));
    setSaveSuccess('');
  };

  // Handle bio change
  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 500) {
      setBio(value);
      setBioError('');
    } else {
      setBioError('Bio must be 500 characters or less');
    }
    setSaveSuccess('');
  };

  // Save username
  const handleSaveUsername = async () => {
    if (!user?.id) return;

    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    // Check if username is the same
    if (username === user.username) {
      setIsEditingUsername(false);
      return;
    }

    setIsSaving(true);
    setUsernameError('');

    try {
      // Check availability first
      const isAvailable = await checkUsernameAvailable(username, user.id);
      if (!isAvailable) {
        setUsernameError('Username is already taken');
        setIsSaving(false);
        return;
      }

      // Update profile
      const updatedUser = await updateUserProfile(user.id, { username });
      setUser({ ...user, username: updatedUser.username });
      setIsEditingUsername(false);
      setSaveSuccess('Username updated successfully');
    } catch (error) {
      setUsernameError(error instanceof Error ? error.message : 'Failed to update username');
    } finally {
      setIsSaving(false);
    }
  };

  // Save bio
  const handleSaveBio = async () => {
    if (!user?.id) return;

    // Check if bio is the same
    if (bio === (user.bio || '')) {
      setIsEditingBio(false);
      return;
    }

    setIsSaving(true);
    setBioError('');

    try {
      const updatedUser = await updateUserProfile(user.id, { bio });
      setUser({ ...user, bio: updatedUser.bio ?? undefined });
      setIsEditingBio(false);
      setSaveSuccess('Bio updated successfully');
    } catch (error) {
      setBioError(error instanceof Error ? error.message : 'Failed to update bio');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancelUsername = () => {
    setUsername(user?.username || '');
    setUsernameError('');
    setIsEditingUsername(false);
  };

  const handleCancelBio = () => {
    setBio(user?.bio || '');
    setBioError('');
    setIsEditingBio(false);
  };

  return (
    <>
      <PageHeader title="Settings" />

      <div className={styles.settings}>
        <motion.section
          className={styles.settings__section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className={styles.settings__section_title}>Account</h2>

          {/* Username Field */}
          <div className={styles.settings__field}>
            <label className={styles.settings__label}>Username</label>
            {isEditingUsername ? (
              <div className={styles.settings__edit_field}>
                <div className={styles.settings__input_wrapper}>
                  <span className={styles.settings__input_prefix}>@</span>
                  <input
                    type="text"
                    className={`${styles.settings__input} ${usernameError ? styles['settings__input--error'] : ''}`}
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="username"
                    maxLength={30}
                    autoFocus
                  />
                </div>
                {usernameError && (
                  <p className={styles.settings__error}>{usernameError}</p>
                )}
                <p className={styles.settings__hint}>
                  Letters, numbers, and underscores only. 3-30 characters.
                </p>
                <div className={styles.settings__edit_actions}>
                  <Button
                    variant="primary"
                    onClick={handleSaveUsername}
                    disabled={isSaving || !!usernameError}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="ghost" onClick={handleCancelUsername}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className={styles.settings__value_editable}>
                <span>@{user?.username}</span>
                <button
                  className={styles.settings__edit_btn}
                  onClick={() => setIsEditingUsername(true)}
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Bio Field */}
          <div className={styles.settings__field}>
            <label className={styles.settings__label}>Bio</label>
            {isEditingBio ? (
              <div className={styles.settings__edit_field}>
                <textarea
                  className={`${styles.settings__textarea} ${bioError ? styles['settings__textarea--error'] : ''}`}
                  value={bio}
                  onChange={handleBioChange}
                  placeholder="Tell people about yourself..."
                  maxLength={500}
                  rows={4}
                  autoFocus
                />
                <div className={styles.settings__char_count}>
                  {bio.length}/500
                </div>
                {bioError && (
                  <p className={styles.settings__error}>{bioError}</p>
                )}
                <div className={styles.settings__edit_actions}>
                  <Button
                    variant="primary"
                    onClick={handleSaveBio}
                    disabled={isSaving || !!bioError}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="ghost" onClick={handleCancelBio}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className={styles.settings__value_editable}>
                <span className={styles.settings__bio_text}>
                  {user?.bio || 'No bio yet'}
                </span>
                <button
                  className={styles.settings__edit_btn}
                  onClick={() => setIsEditingBio(true)}
                >
                  {user?.bio ? 'Edit' : 'Add'}
                </button>
              </div>
            )}
          </div>

          {/* Success message */}
          {saveSuccess && (
            <motion.p
              className={styles.settings__success}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {saveSuccess}
            </motion.p>
          )}

          <div className={styles.settings__field}>
            <label className={styles.settings__label}>Wallet Address</label>
            <div className={styles.settings__value_mono}>
              {user?.walletAddress?.slice(0, 12)}...{user?.walletAddress?.slice(-12)}
            </div>
          </div>

          <div className={styles.settings__field}>
            <label className={styles.settings__label}>Role</label>
            <div className={styles.settings__badge}>
              {user?.role === 'admin' ? 'Admin' : 'Member'}
            </div>
          </div>
        </motion.section>

        <motion.section
          className={styles.settings__section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className={styles.settings__section_title}>Preferences</h2>

          <div className={styles.settings__toggle}>
            <div className={styles.settings__toggle_info}>
              <span className={styles.settings__toggle_label}>Theme</span>
              <span className={styles.settings__toggle_description}>
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </span>
            </div>
            <div className={styles.settings__toggle_switch}>
              <input
                type="checkbox"
                id="themeToggle"
                checked={theme === 'light'}
                onChange={toggleTheme}
              />
              <label htmlFor="themeToggle" />
            </div>
          </div>

          <div className={styles.settings__field}>
            <label className={styles.settings__label}>Language</label>
            <div className={styles.settings__value}>English</div>
          </div>
        </motion.section>

        <motion.section
          className={styles.settings__section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className={styles.settings__section_title}>Privacy</h2>

          <div className={styles.settings__toggle}>
            <div className={styles.settings__toggle_info}>
              <span className={styles.settings__toggle_label}>Show holdings publicly</span>
              <span className={styles.settings__toggle_description}>
                Display your token holdings on your profile
              </span>
            </div>
            <div className={styles.settings__toggle_switch}>
              <input type="checkbox" id="showHoldings" defaultChecked />
              <label htmlFor="showHoldings" />
            </div>
          </div>

          <div className={styles.settings__toggle}>
            <div className={styles.settings__toggle_info}>
              <span className={styles.settings__toggle_label}>Allow transmissions from anyone</span>
              <span className={styles.settings__toggle_description}>
                Let any user send you private messages
              </span>
            </div>
            <div className={styles.settings__toggle_switch}>
              <input type="checkbox" id="allowDMs" />
              <label htmlFor="allowDMs" />
            </div>
          </div>
        </motion.section>

        <motion.section
          className={`${styles.settings__section} ${styles['settings__section--danger']}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className={styles.settings__section_title}>Danger Zone</h2>

          <div className={styles.settings__danger}>
            <div className={styles.settings__danger_info}>
              <p className={styles.settings__danger_title}>Disconnect Wallet</p>
              <p className={styles.settings__danger_description}>
                Sign out and disconnect your wallet from InnerCircle
              </p>
            </div>
            <Button variant="locked" onClick={handleLogout}>
              Disconnect
            </Button>
          </div>
        </motion.section>
      </div>
    </>
  );
}
