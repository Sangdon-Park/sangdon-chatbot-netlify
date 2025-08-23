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
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  console.log('SUPABASE_URL exists:', !!SUPABASE_URL);
  console.log('SUPABASE_SERVICE_KEY exists:', !!SUPABASE_SERVICE_KEY);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Supabase not configured',
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SUPABASE_SERVICE_KEY
      })
    };
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Test insert
    const testData = {
      user_message: 'Test message',
      bot_response: 'Test response',
      conversation_history: [],
      created_at: new Date().toISOString(),
      user_ip: 'test-ip'
    };

    console.log('Attempting to insert:', testData);

    const { data, error } = await supabase
      .from('chat_logs')
      .insert([testData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Database error',
          details: error.message,
          code: error.code,
          hint: error.hint
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