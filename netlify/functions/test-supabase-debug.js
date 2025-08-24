const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    const debugInfo = {
      url_exists: !!supabaseUrl,
      key_exists: !!supabaseKey,
      url_value: supabaseUrl ? supabaseUrl.substring(0, 40) + '...' : 'NOT SET',
      key_preview: supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'NOT SET',
      env_vars: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
    };

    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          error: 'Missing Supabase credentials',
          debug: debugInfo
        })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test simple insert
    const testData = {
      user_message: 'TEST MESSAGE',
      bot_response: 'TEST RESPONSE',
      conversation_history: [],
      action_taken: 'TEST',
      search_results: null,
      user_ip: '127.0.0.1',
      user_agent: 'Test Agent'
    };

    console.log('Attempting insert with:', testData);
    
    const { data, error } = await supabase
      .from('chat_logs')
      .insert([testData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          error: error.message,
          error_code: error.code,
          error_details: error.details,
          debug: debugInfo
        })
      };
    }

    // Test read to verify
    const { data: readData, error: readError } = await supabase
      .from('chat_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        inserted_data: data,
        latest_entry: readData?.[0],
        debug: debugInfo
      })
    };

  } catch (error) {
    console.error('Exception:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        stack: error.stack
      })
    };
  }
};