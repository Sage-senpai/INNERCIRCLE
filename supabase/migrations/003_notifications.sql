-- ============================================================================
-- NOTIFICATIONS SYSTEM
-- ============================================================================

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('signal', 'echo', 'relay', 'follow', 'mention', 'community_join')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read, created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT WITH CHECK (true);

-- ============================================================================
-- NOTIFICATION TRIGGERS
-- ============================================================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, actor_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_actor_id)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Notify on new signal
CREATE OR REPLACE FUNCTION notify_on_signal()
RETURNS TRIGGER AS $$
BEGIN
  -- Get post author
  PERFORM create_notification(
    (SELECT author_id FROM posts WHERE id = NEW.post_id),
    'signal',
    'New Signal',
    (SELECT username FROM users WHERE id = NEW.user_id) || ' signaled your post',
    '/feed',
    NEW.user_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_signal AFTER INSERT ON signals
  FOR EACH ROW EXECUTE FUNCTION notify_on_signal();

-- Trigger: Notify on new echo
CREATE OR REPLACE FUNCTION notify_on_echo()
RETURNS TRIGGER AS $$
BEGIN
  -- Get post author
  PERFORM create_notification(
    (SELECT author_id FROM posts WHERE id = NEW.post_id),
    'echo',
    'New Echo',
    (SELECT username FROM users WHERE id = NEW.author_id) || ' echoed your post',
    '/feed',
    NEW.author_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_echo AFTER INSERT ON echoes
  FOR EACH ROW EXECUTE FUNCTION notify_on_echo();

-- Trigger: Notify on new relay
CREATE OR REPLACE FUNCTION notify_on_relay()
RETURNS TRIGGER AS $$
BEGIN
  -- Get post author
  PERFORM create_notification(
    (SELECT author_id FROM posts WHERE id = NEW.post_id),
    'relay',
    'New Relay',
    (SELECT username FROM users WHERE id = NEW.user_id) || ' relayed your post',
    '/feed',
    NEW.user_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_relay AFTER INSERT ON relays
  FOR EACH ROW EXECUTE FUNCTION notify_on_relay();

-- Trigger: Notify on new follow
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    NEW.center_id,
    'follow',
    'New Follower',
    (SELECT username FROM users WHERE id = NEW.satellite_id) || ' started following you',
    '/profile/' || (SELECT username FROM users WHERE id = NEW.satellite_id),
    NEW.satellite_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_follow AFTER INSERT ON orbits
  FOR EACH ROW EXECUTE FUNCTION notify_on_follow();
