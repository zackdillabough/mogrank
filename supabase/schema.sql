-- Supabase SQL Schema for MogRank
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  levels INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  active BOOLEAN DEFAULT true,
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
  ramp_order_id TEXT UNIQUE,
  discord_id TEXT,
  discord_username TEXT,
  discord_avatar TEXT,
  package_id UUID REFERENCES packages(id),
  package_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  wallet_address TEXT,
  crypto_amount TEXT,
  crypto_currency TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  CONSTRAINT valid_status CHECK (status IN (
    'pending_payment', 'paid', 'in_queue', 'scheduled',
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

-- Settings table for admin configuration
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default packages
INSERT INTO packages (name, description, price, levels, duration_minutes) VALUES
  ('Starter', '100 levels in ~15 minutes (AFK-friendly)', 5.00, 100, 15),
  ('Standard', '250 levels in ~30 minutes (AFK-friendly)', 10.00, 250, 30),
  ('Premium', '500 levels in ~45 minutes (AFK-friendly)', 18.00, 500, 45),
  ('Ultimate', '1000 levels in ~60 minutes (AFK-friendly)', 30.00, 1000, 60)
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_discord_id ON orders(discord_id);
CREATE INDEX IF NOT EXISTS idx_orders_ramp_order_id ON orders(ramp_order_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_order_id ON queue(order_id);
CREATE INDEX IF NOT EXISTS idx_queue_discord_id ON queue(discord_id);
CREATE INDEX IF NOT EXISTS idx_queue_appointment_time ON queue(appointment_time);
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);

-- Row Level Security (RLS)
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

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
