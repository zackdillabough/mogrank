-- Supabase SQL Schema for MogRank
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  header TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  estimated_duration INTEGER DEFAULT 60, -- Duration in minutes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (Discord OAuth users)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  discord_id TEXT UNIQUE NOT NULL,
  discord_username TEXT NOT NULL,
  discord_avatar TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  discord_id TEXT,
  discord_username TEXT,
  discord_avatar TEXT,
  package_id UUID REFERENCES packages(id),
  package_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  refunded_amount DECIMAL(10, 2),
  availability JSONB,
  status TEXT NOT NULL DEFAULT 'in_queue',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  CONSTRAINT valid_status CHECK (status IN (
    'in_queue', 'scheduled',
    'in_progress', 'review', 'completed', 'missed', 'dispute', 'refunded'
  ))
);

-- Queue table (Kanban items)
CREATE TABLE IF NOT EXISTS queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  discord_id TEXT,
  discord_username TEXT,
  package_id UUID REFERENCES packages(id),
  package_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  availability JSONB,
  appointment_time TIMESTAMPTZ,
  room_code TEXT,
  notes TEXT,
  proof_added BOOLEAN DEFAULT false,
  missed_count INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_queue_status CHECK (status IN (
    'new', 'scheduled', 'in_progress', 'review', 'finished'
  ))
);

-- Sessions table (individual sessions for multi-session orders)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  queue_id UUID REFERENCES queue(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  appointment_time TIMESTAMPTZ,
  room_code TEXT,
  notes TEXT,
  proof_added BOOLEAN DEFAULT false,
  missed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_session_status CHECK (status IN (
    'pending', 'scheduled', 'in_progress', 'completed', 'missed'
  ))
);

-- Settings table for admin configuration
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQs table
CREATE TABLE IF NOT EXISTS faqs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default FAQs
INSERT INTO faqs (question, answer, position) VALUES
  ('How does this work?', 'After purchasing, we''ll DM you on Discord with a lobby code. Join the private lobby and we''ll handle the rest — you level up while we run games.', 0),
  ('Do I need to actively play?', 'For prestige packages, you just need to be in the lobby — no active gameplay required. For ID cards and achievements, some may require brief participation.', 1),
  ('Is this safe? Will I get banned?', 'We use private lobbies so there''s no public exposure. Use at your own discretion.', 2),
  ('How long does delivery take?', 'After payment, we''ll reach out on Discord to schedule your session. Most orders are started within a few hours during active times.', 3),
  ('What if I ordered but haven''t heard back?', 'Don''t worry — we process orders manually and will DM you on Discord. If it''s been more than 24 hours, feel free to reach out to us directly.', 4),
  ('Can I request a refund?', 'Refunds are available for orders that haven''t been started. Once a session is in progress, we can''t offer refunds.', 5),
  ('What payment methods do you accept?', 'We accept credit/debit cards, Apple Pay, Google Pay, and bank transfers through our secure payment processor.', 6),
  ('How do I track my order?', 'Sign in with Discord and go to "My Orders" to see the status of all your orders in real time.', 7)
ON CONFLICT DO NOTHING;

-- Insert default packages
INSERT INTO packages (name, header, subtitle, description, price) VALUES
  ('1 Prestige', '100', 'levels', '100 levels in ~15 minutes', 5.00),
  ('5 Prestiges', '500', 'levels', '500 levels, may require multiple sessions', 20.00),
  ('20 Prestiges', '2,000', 'levels', 'Max prestige — 2,000 levels, multiple sessions', 75.00)
ON CONFLICT DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('proof_required', '{"enabled": true}'::jsonb),
  ('auto_archive_days', '{"days": 7}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_queue_updated_at
  BEFORE UPDATE ON queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Pending checkouts table (stores checkout data before payment confirmation)
CREATE TABLE IF NOT EXISTS pending_checkouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stripe_session_id TEXT,
  discord_id TEXT NOT NULL,
  discord_username TEXT,
  discord_avatar TEXT,
  package_id UUID REFERENCES packages(id),
  package_name TEXT NOT NULL,
  availability JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_discord_id ON orders(discord_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_order_id ON queue(order_id);
CREATE INDEX IF NOT EXISTS idx_queue_discord_id ON queue(discord_id);
CREATE INDEX IF NOT EXISTS idx_queue_appointment_time ON queue(appointment_time);
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
CREATE INDEX IF NOT EXISTS idx_pending_checkouts_stripe_session_id ON pending_checkouts(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_queue_id ON sessions(queue_id);
CREATE INDEX IF NOT EXISTS idx_sessions_appointment_time ON sessions(appointment_time);

-- Row Level Security (RLS)
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- No public policies for pending_checkouts - only accessible via service role key

-- Policies for packages (public read)
CREATE POLICY "Packages are viewable by everyone" ON packages
  FOR SELECT USING (active = true);

CREATE POLICY "Only admins can modify packages" ON packages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE discord_id = current_setting('request.jwt.claims')::json->>'discord_id'
      AND is_admin = true
    )
  );

-- Policies for users
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (discord_id = current_setting('request.jwt.claims')::json->>'discord_id');

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE discord_id = current_setting('request.jwt.claims')::json->>'discord_id'
      AND is_admin = true
    )
  );

-- Policies for orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (discord_id = current_setting('request.jwt.claims')::json->>'discord_id');

CREATE POLICY "Admins can view all orders" ON orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE discord_id = current_setting('request.jwt.claims')::json->>'discord_id'
      AND is_admin = true
    )
  );

-- Policies for queue
CREATE POLICY "Users can view their own queue items" ON queue
  FOR SELECT USING (discord_id = current_setting('request.jwt.claims')::json->>'discord_id');

CREATE POLICY "Admins can manage all queue items" ON queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE discord_id = current_setting('request.jwt.claims')::json->>'discord_id'
      AND is_admin = true
    )
  );

-- Policies for settings (admin only)
CREATE POLICY "Only admins can access settings" ON settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE discord_id = current_setting('request.jwt.claims')::json->>'discord_id'
      AND is_admin = true
    )
  );

-- Policies for FAQs (public read, admin write)
CREATE POLICY "FAQs are viewable by everyone" ON faqs
  FOR SELECT USING (active = true);

CREATE POLICY "Only admins can modify FAQs" ON faqs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE discord_id = current_setting('request.jwt.claims')::json->>'discord_id'
      AND is_admin = true
    )
  );

-- Policies for sessions (admin only, accessed via service role typically)
CREATE POLICY "Admins can manage all sessions" ON sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE discord_id = current_setting('request.jwt.claims')::json->>'discord_id'
      AND is_admin = true
    )
  );
