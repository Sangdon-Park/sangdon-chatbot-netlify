const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Check for admin password
  const adminPassword = event.headers.authorization?.replace('Bearer ', '');
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Supabase not configured' })
    };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const params = event.queryStringParameters || {};
    
    // Build query
    let query = supabase
      .from('chat_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (params.date) {
      const startDate = new Date(params.date);
      const endDate = new Date(params.date);
      endDate.setDate(endDate.getDate() + 1);
      query = query.gte('created_at', startDate.toISOString())
                   .lt('created_at', endDate.toISOString());
    }

    if (params.ip) {
      query = query.ilike('user_ip', `%${params.ip}%`);
    }

    if (params.search) {
      query = query.or(`user_message.ilike.%${params.search}%,bot_response.ilike.%${params.search}%`);
    }

    // Pagination
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.pageSize) || 50;
    query = query.range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Get stats
    const { count: totalCount } = await supabase
      .from('chat_logs')
      .select('*', { count: 'exact', head: true });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayCount } = await supabase
      .from('chat_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    const { data: ips } = await supabase
      .from('chat_logs')
      .select('user_ip');
    const uniqueIPs = new Set(ips?.map(row => row.user_ip) || []);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        logs: data,
        totalCount: count,
        page,
        pageSize,
        stats: {
          totalChats: totalCount || 0,
          todayChats: todayCount || 0,
          uniqueIPs: uniqueIPs.size,
          avgLength: totalCount > 0 ? Math.round(totalCount / uniqueIPs.size) : 0
        }
      })
    };

  } catch (error) {
    console.error('Error fetching logs:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};