# Supabase Setup Guide for Netlify Chatbot

## Environment Variables Configuration

### Required Environment Variables in Netlify

Set these in Netlify Dashboard → Site Settings → Environment Variables:

1. **SUPABASE_URL**: Your Supabase project URL
   - Example: `https://xxxxxxxxxxxxx.supabase.co`
   - Find it in: Supabase Dashboard → Settings → API → Project URL

2. **SUPABASE_ANON_KEY** or **SUPABASE_SERVICE_KEY**: Your Supabase API key
   - The code now supports both variable names
   - For production, use `SUPABASE_ANON_KEY` (safer with RLS)
   - For testing/admin, use `SUPABASE_SERVICE_KEY` (bypasses RLS)
   - Find it in: Supabase Dashboard → Settings → API → Project API keys

3. **GEMINI_API_KEY**: Your Google Gemini API key
   - Get it from: https://makersuite.google.com/app/apikey

## Database Setup

### 1. Create the Table

Run the SQL from `chat_logs_schema.sql` in Supabase SQL Editor:

```sql
-- The schema creates a table with these columns:
- id (uuid, primary key)
- user_message (text)
- bot_response (text)
- conversation_history (jsonb)
- action_taken (text)
- search_results (jsonb)
- user_ip (text)
- user_agent (text)
- created_at (timestamptz)
```

### 2. Configure Row Level Security (RLS)

The schema includes RLS policies that:
- Allow service role full access
- Enable anonymous inserts (if using ANON_KEY)

### 3. Test the Connection

Use the test endpoint to verify setup:
```
https://your-site.netlify.app/.netlify/functions/test-supabase
```

## Debugging Issues

### Check Logs in Netlify

1. Go to Netlify Dashboard → Functions tab
2. Click on `chat-ai-driven` function
3. View real-time logs

### Common Issues and Solutions

#### Issue: "Supabase not configured"
- **Solution**: Check that environment variables are set in Netlify
- The logs will show which variables are missing

#### Issue: "Permission denied" (Error 42501)
- **Solution**: Check RLS policies or use SERVICE_KEY instead of ANON_KEY
- Run this SQL to allow anonymous inserts:
```sql
CREATE POLICY "Allow anonymous inserts" ON chat_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);
```

#### Issue: "Table does not exist" (Error 42P01)
- **Solution**: Run the SQL schema file in Supabase

#### Issue: "NOT NULL violation" (Error 23502)
- **Solution**: Check that all required fields are being sent
- Required fields: user_message, bot_response

## Testing

### Test with curl:
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/chat-ai-driven \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, this is a test"}'
```

### Check if data was inserted:
Go to Supabase Dashboard → Table Editor → chat_logs

## Monitoring

The enhanced debug logs will show:
- Timestamp of each request
- Which environment variables are found
- Detailed error messages with error codes
- Success confirmation with inserted row ID

Look for these log sections:
- `=== SUPABASE DEBUG START ===`
- `=== SUPABASE ERROR ===` (if error)
- `=== SUPABASE SUCCESS ===` (if success)
- `=== SUPABASE DEBUG END ===`