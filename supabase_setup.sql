-- Create chat_logs table for storing conversation history
CREATE TABLE chat_logs (
  id BIGSERIAL PRIMARY KEY,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  conversation_history JSONB,
  user_ip VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_chat_logs_created_at ON chat_logs(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (for logging)
CREATE POLICY "Allow anonymous inserts" ON chat_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow reading recent logs (optional, for admin view)
CREATE POLICY "Allow reading recent logs" ON chat_logs
  FOR SELECT
  TO anon
  USING (created_at > NOW() - INTERVAL '7 days');