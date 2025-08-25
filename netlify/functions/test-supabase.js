const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  // Try both possible env var names
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  console.log('=== TEST SUPABASE CONNECTION ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('SUPABASE_URL exists:', !!SUPABASE_URL);
  console.log('SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);
  console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
  console.log('Using key:', !!SUPABASE_SERVICE_KEY ? 'Found' : 'Missing');
  console.log('All SUPABASE env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')).join(', '));

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Supabase not configured',
        hasUrl: !!SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
        hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
        envVars: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
      })
    };
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Test insert with all fields from the schema
    const testData = {
      user_message: 'Test message from test-supabase function',
      bot_response: 'Test response from test-supabase function',
      conversation_history: [{role: 'user', message: 'test'}, {role: 'assistant', message: 'test response'}],
      action_taken: 'test_action',
      search_results: [{title: 'Test Result', type: 'test'}],
      user_ip: event.headers['x-forwarded-for'] || 'test-ip',
      user_agent: event.headers['user-agent'] || 'test-agent'
    };

    console.log('Attempting to insert:', JSON.stringify(testData));

    const { data, error } = await supabase
      .from('chat_logs')
      .insert([testData])
      .select();

    if (error) {
      console.error('=== SUPABASE ERROR ===');
      console.error('Full error:', JSON.stringify(error));
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error hint:', error.hint);
      
      // Specific error handling
      if (error.code === '42501') {
        console.error('RLS Policy error - check policies');
      } else if (error.code === '42P01') {
        console.error('Table does not exist - run SQL schema');
      }
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Database error',
          details: error.message,
          code: error.code,
          hint: error.hint,
          fullError: error
        })
      };
    }

    console.log('Insert successful:', data);

    // Get count
    const { count } = await supabase
      .from('chat_logs')
      .select('*', { count: 'exact', head: true });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        inserted: data,
        totalCount: count,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Server error',
        message: error.message
      })
    };
  }
};