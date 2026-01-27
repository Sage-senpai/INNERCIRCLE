# InnerCircle - Complete Implementation Guide

## 🎯 What's Been Implemented

### ✅ 1. Multi-Wallet Account System (COMPLETE)

**Problem Solved:** Users can now link up to 3 wallets to ONE account with a single username.

**Database Changes:**
- `supabase/migrations/004_multi_wallet_system.sql` - New migration
- Added to `FULL_SCHEMA_CLONE.sql` (append this migration)

**Key Features:**
- Login with any linked wallet → same account
- 3 wallet maximum per account
- One primary wallet (cannot be removed)
- Automatic account creation on first login
- Username shared across all wallets

**New Functions:**
```typescript
// Get or create user when wallet connects
getOrCreateUserByWallet(walletAddress, username?)

// Get user with all linked wallets
getUserWithLinkedWallets(userId)

// Link additional wallet (max 3)
linkWalletToAccount(userId, walletAddress)

// Unlink wallet (not primary)
unlinkWalletFromAccount(userId, walletAddress)

// Check if wallet has user
getUserByWallet(walletAddress)
```

**Updated Auth Store:**
- Added `LinkedWallet` interface
- Added `primaryWalletAddress` to User
- Added `linkedWallets` array to User
- Added `updateUserProfile()` method

---

### ✅ 2. Premium EchoComposer (COMPLETE)

**File:** `src/components/interactions/EchoComposer/EchoComposer.tsx`

**New Features:**
- 🎨 User avatar and display name in header
- 📊 Circular progress indicator for character count
- ✨ Animated glow effect on focus
- ⌨️ Cmd/Ctrl + Enter to submit
- 🌊 Loading animation with wave emoji
- 🎯 Smart character counter (shows remaining at 80%)
- 💫 Smooth enter/exit animations
- 🎭 Success feedback before closing

**Character Limits:**
- 500 characters max
- Warning at 90% (450 chars)
- Danger at 100% (500 chars)

**UI States:**
- Default
- Focused (with glow)
- Near limit (orange progress)
- At limit (red progress)
- Submitting (overlay with animation)

---

## 🚀 Remaining Implementations Needed

### 3. Real-Time Transmissions (DMs)

**Tables Already Exist:**
- `transmission_threads` - DM conversations
- `transmissions` - Individual messages

**What to Build:**

#### A. Transmissions Store (`src/store/transmissions.store.ts`)
```typescript
interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface Thread {
  id: string;
  participant1: string;
  participant2: string;
  lastMessageAt: string;
  messages: Message[];
}

interface TransmissionsState {
  threads: Thread[];
  activeThread: string | null;
  unreadCount: number;

  fetchThreads: () => Promise<void>;
  fetchMessages: (threadId: string) => Promise<void>;
  sendMessage: (threadId: string, content: string) => Promise<void>;
  markAsRead: (threadId: string) => Promise<void>;
  subscribeToThread: (threadId: string) => void;
}
```

#### B. Real-Time Subscription
```typescript
// Subscribe to new messages
supabase
  .channel('dm_' + threadId)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'transmissions',
    filter: `thread_id=eq.${threadId}`
  }, (payload) => {
    // Add message to state
  })
  .subscribe();
```

#### C. Supabase Actions
```typescript
// Get or create DM thread
async function getOrCreateThread(userId: string, otherUserId: string) {
  // Check if thread exists
  const { data } = await supabase
    .from('transmission_threads')
    .select('*')
    .or(`and(participant_1.eq.${userId},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${userId})`)
    .single();

  if (data) return data;

  // Create new thread
  return await supabase
    .from('transmission_threads')
    .insert({
      participant_1: userId,
      participant_2: otherUserId
    })
    .select()
    .single();
}

// Send message
async function sendTransmission(threadId: string, senderId: string, content: string) {
  return await supabase
    .from('transmissions')
    .insert({
      thread_id: threadId,
      sender_id: senderId,
      content
    })
    .select()
    .single();
}

// Get messages for thread
async function fetchThreadMessages(threadId: string) {
  return await supabase
    .from('transmissions')
    .select('*, sender:users(id, username, display_name, avatar_url)')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
}
```

#### D. UI Components Needed
- `src/app/(platform)/messages/page.tsx` - Messages page
- `src/components/transmissions/ThreadList.tsx` - List of conversations
- `src/components/transmissions/MessageThread.tsx` - Message view
- `src/components/transmissions/MessageComposer.tsx` - Send messages

---

### 4. Communities Page with Real Data

**Create:** `src/app/(platform)/communities/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { fetchCommunities } from '@/lib/supabase/actions';

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'joined' | 'popular'

  useEffect(() => {
    loadCommunities();
  }, [filter]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('communities')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'communities'
      }, (payload) => {
        setCommunities(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'communities'
      }, (payload) => {
        setCommunities(prev =>
          prev.map(c => c.id === payload.new.id ? payload.new : c)
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadCommunities() {
    const data = await fetchCommunities(filter);
    setCommunities(data);
  }

  // Render community grid/list
}
```

**Features:**
- Browse all communities
- Filter by joined/popular
- Real-time member count updates
- Join community with BagsAPI verification
- Search communities by token

---

### 5. Profile Page with Real-Time Updates

**Create:** `src/app/(platform)/profile/[username]/page.tsx`

```typescript
'use client';

export default function ProfilePage({ params }: { params: { username: string } }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    posts: 0
  });

  useEffect(() => {
    loadProfile();
  }, [params.username]);

  // Real-time post updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user_posts_' + user.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: `author_id=eq.${user.id}`
      }, (payload) => {
        // Add new post
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  async function loadProfile() {
    // Fetch user by username
    // Fetch user's posts
    // Fetch followers/following count
  }

  // Render profile with:
  // - Avatar, username, bio
  // - Linked wallets display
  // - Follow button
  // - Post feed
  // - Stats (followers, following, posts)
}
```

---

### 6. Settings Page

**Create:** `src/app/(platform)/settings/page.tsx`

**Sections:**

#### A. Account Settings
- Display name
- Username (immutable after creation)
- Bio
- Avatar upload

#### B. Linked Wallets
```typescript
function WalletSettings() {
  const { user } = useAuthStore();
  const [wallets, setWallets] = useState<LinkedWallet[]>([]);
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  async function loadWallets() {
    const userData = await getUserWithLinkedWallets(user.id);
    setWallets(userData.linkedWallets);
  }

  async function handleLinkWallet() {
    // Trigger wallet connection
    // Call linkWalletToAccount()
    // Refresh wallet list
  }

  async function handleUnlinkWallet(walletAddress: string) {
    const result = await unlinkWalletFromAccount(user.id, walletAddress);
    if (result.success) {
      loadWallets();
    }
  }

  return (
    <div>
      <h2>Linked Wallets ({wallets.length}/3)</h2>
      {wallets.map(wallet => (
        <div key={wallet.walletAddress}>
          <span>{wallet.walletAddress.slice(0, 8)}...</span>
          {wallet.isPrimary && <badge>Primary</badge>}
          {!wallet.isPrimary && (
            <button onClick={() => handleUnlinkWallet(wallet.walletAddress)}>
              Unlink
            </button>
          )}
        </div>
      ))}
      {wallets.length < 3 && (
        <button onClick={handleLinkWallet}>Link New Wallet</button>
      )}
    </div>
  );
}
```

#### C. Privacy Settings
- Profile visibility
- Show wallet addresses
- Allow DMs from non-followers

#### D. Notification Preferences
- Signal notifications
- Echo notifications
- Follow notifications
- Community updates

---

### 7. Real-Time Search

**Create:** `src/components/search/SearchModal.tsx`

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import debounce from 'lodash/debounce';

export function SearchModal() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    users: [],
    communities: [],
    posts: []
  });
  const [activeTab, setActiveTab] = useState('all');

  const search = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults({ users: [], communities: [], posts: [] });
        return;
      }

      // Search users
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .ilike('username', `%${searchQuery}%`)
        .limit(5);

      // Search communities
      const { data: communities } = await supabase
        .from('communities')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(5);

      // Search posts (if enabled)
      const { data: posts } = await supabase
        .from('posts')
        .select('*, author:users(*)')
        .ilike('content', `%${searchQuery}%`)
        .eq('visibility', 'public')
        .limit(5);

      setResults({ users, communities, posts });
    }, 300),
    []
  );

  useEffect(() => {
    search(query);
  }, [query, search]);

  // Render search results with tabs
}
```

---

### 8. Real-Time Leaderboard Updates

**Update:** `src/store/intelligence.store.ts`

```typescript
// Add real-time subscription
subscribeToLeaderboard: (tokenAddress: string, period: string) => {
  const channel = supabase
    .channel('leaderboard_' + tokenAddress)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'leaderboard_entries',
      filter: `period=eq.${period}`
    }, (payload) => {
      // Update leaderboard state
      set((state) => ({
        activityLeaderboard: state.activityLeaderboard.map(entry =>
          entry.user_id === payload.new.user_id
            ? { ...entry, ...payload.new }
            : entry
        ).sort((a, b) => b.score - a.score)
      }));
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}
```

---

## 📋 Migration Checklist

### Step 1: Update Database
```sql
-- Run in Supabase SQL Editor
-- If using new instance, already in FULL_SCHEMA_CLONE.sql
-- If updating existing:
\i supabase/migrations/004_multi_wallet_system.sql
```

### Step 2: Update Onboarding Flow
```typescript
// src/app/(auth)/onboarding/page.tsx or connect/page.tsx

async function handleWalletConnect(walletAddress: string) {
  // Use multi-wallet function
  const result = await getOrCreateUserByWallet(walletAddress);

  if (result.is_new_user) {
    // New user - show onboarding
    router.push('/onboarding?username=' + result.username);
  } else {
    // Existing user - redirect to feed
    const userData = await getUserWithLinkedWallets(result.user_id);
    setUser(userData);
    router.push('/feed');
  }
}
```

### Step 3: EchoComposer Styles
Create `src/components/interactions/EchoComposer/EchoComposer.module.scss`:

```scss
.composer {
  background: rgba(218, 255, 237, 0.03);
  border: 1px solid rgba(218, 255, 237, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;

  &--focused {
    border-color: rgba(9, 161, 41, 0.3);
    box-shadow: 0 0 30px rgba(9, 161, 41, 0.2);
  }
}

.composer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.composer__user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.composer__user_info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.composer__username {
  font-weight: 600;
  color: #daffed;
  font-size: 0.875rem;
}

.composer__badge {
  font-size: 0.75rem;
  color: #09a129;
  font-weight: 500;
}

.composer__close {
  background: transparent;
  border: none;
  color: #948b89;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(218, 255, 237, 0.1);
    color: #daffed;
  }
}

.composer__input_container {
  position: relative;
  margin-bottom: 1rem;
}

.composer__input {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(218, 255, 237, 0.1);
  border-radius: 12px;
  padding: 1rem;
  color: #daffed;
  font-family: inherit;
  font-size: 0.938rem;
  line-height: 1.6;
  resize: none;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: rgba(9, 161, 41, 0.3);
    background: rgba(0, 0, 0, 0.5);
  }

  &::placeholder {
    color: #948b89;
  }
}

.composer__glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, rgba(9, 161, 41, 0.2), rgba(218, 255, 237, 0.1));
  border-radius: 12px;
  z-index: -1;
  filter: blur(10px);
}

.composer__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.composer__meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.composer__char_count {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.char_progress {
  transform: rotate(-90deg);
}

.char_progress__bg {
  stroke: rgba(218, 255, 237, 0.1);
}

.char_progress__bar {
  stroke: #09a129;
  transition: stroke 0.3s;

  &--warning {
    stroke: #f59e0b;
  }

  &--danger {
    stroke: #ef4444;
  }
}

.char_count__text {
  position: absolute;
  font-size: 0.75rem;
  font-weight: 600;
  color: #09a129;

  &--warning {
    color: #f59e0b;
  }
}

.composer__hint {
  font-size: 0.75rem;
  color: #948b89;
  font-family: 'Courier New', monospace;
}

.composer__actions {
  display: flex;
  gap: 0.5rem;
}

.composer__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  z-index: 10;
}

.composer__loader {
  font-size: 3rem;
}
```

---

## 🎨 Premium UI Guidelines

### Color Palette
- **Primary Green:** `#09a129`
- **Background:** `#000000` (black)
- **Text Primary:** `#daffed` (light mint)
- **Text Secondary:** `#948b89` (muted gray)
- **Accent Red:** `#6c0e23`
- **Success:** `#09a129`
- **Warning:** `#f59e0b`
- **Danger:** `#ef4444`

### Animation Principles
1. **Entrance:** Scale from 0.98 to 1, fade in
2. **Exit:** Scale to 0.98, fade out
3. **Hover:** Scale 1.05, add glow
4. **Active:** Scale 0.95
5. **Duration:** 0.2-0.3s for UI, 0.5-1s for loaders

### Typography
- **Headings:** -2px letter-spacing, 700 weight
- **Body:** 0.938rem (15px), 1.6 line-height
- **Small:** 0.75-0.875rem
- **Monospace:** 'Courier New' for technical info

---

## 🔐 Security Considerations

### Multi-Wallet Security
1. Only allow linking verified wallets
2. Require signature verification before linking
3. Cannot unlink primary wallet
4. Minimum 1 wallet per account
5. Maximum 3 wallets per account

### DM Privacy
1. Only thread participants can view messages
2. RLS enforces participant checks
3. No message editing (immutable)
4. Optional message deletion (soft delete)

### Profile Privacy
1. Users can hide wallet addresses
2. Users can control DM permissions
3. Optional private profiles

---

## ✅ Testing Checklist

### Multi-Wallet System
- [ ] New user creates account with wallet
- [ ] Existing user logs in with primary wallet
- [ ] User links 2nd wallet successfully
- [ ] User links 3rd wallet successfully
- [ ] User cannot link 4th wallet (error)
- [ ] User cannot link wallet already in use
- [ ] User logs in with 2nd wallet → same account
- [ ] User cannot unlink primary wallet
- [ ] User can unlink non-primary wallet
- [ ] Username remains consistent across wallets

### EchoComposer
- [ ] Opens with smooth animation
- [ ] Auto-focuses textarea
- [ ] Character counter works
- [ ] Progress ring changes color at limits
- [ ] Cmd+Enter submits
- [ ] Loading animation displays
- [ ] Success feedback before closing
- [ ] Echo appears in feed instantly

### Real-Time Features
- [ ] New posts appear without refresh
- [ ] Signal counts update live
- [ ] Notifications trigger instantly
- [ ] Leaderboard updates automatically
- [ ] DMs arrive in real-time
- [ ] Community member counts update

---

## 🚀 Deployment Notes

1. Run migration 004 before deploying new code
2. Update all `getUserByWallet` calls to use new function
3. Test wallet linking in production with real wallets
4. Monitor Supabase real-time connections
5. Set up error tracking for failed wallet links
6. Consider rate limiting for wallet linking (prevent spam)

---

## 📊 Performance Optimizations

1. **Debounce search:** 300ms delay
2. **Paginate leaderboards:** 50 entries per page
3. **Cache DM threads:** Store in Zustand
4. **Lazy load messages:** Infinite scroll
5. **Optimize RLS:** Ensure indexes on foreign keys
6. **Connection pooling:** Enable in Supabase

---

## 🎉 Summary

You now have:
✅ Multi-wallet accounts (1 user, 3 wallets max)
✅ Premium Web3 EchoComposer
✅ Real-time feed with Supabase
✅ Notifications system
✅ Complete database schema
✅ Solana-only (Polkadot removed)

Still need to build:
⏳ DMs/Transmissions UI
⏳ Communities page
⏳ Profile pages
⏳ Settings page
⏳ Search functionality
⏳ Real-time leaderboards

Everything is architected and ready - just needs UI implementation following the patterns already established!
