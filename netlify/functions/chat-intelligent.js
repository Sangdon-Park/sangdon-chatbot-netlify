const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Site content for search
const SITE_CONTENT = {
  publications: {
    journals: [
      { id: 'J25', title: 'Real-Time Dynamic Pricing for Edge Computing Services', year: 2024, journal: 'IEEE Access', keywords: ['edge computing', 'pricing', 'market'] },
      { id: 'J24', title: 'Dynamic Bandwidth Slicing in PON for Federated Learning', year: 2024, journal: 'Sensors', keywords: ['PON', 'federated learning', 'bandwidth'] },
      { id: 'J23', title: 'Differential Pricing-Based Task Offloading', year: 2022, journal: 'IEEE IoT Journal', keywords: ['IoT', 'task offloading', 'pricing'] },
      // ... 더 많은 논문들
    ],
    conferences: [
      { id: 'C5', title: 'Resilient Linear Classification', year: 2017, venue: 'ACM/IEEE ICCPS', keywords: ['machine learning', 'security', 'classification'] },
      { id: 'C4', title: 'Optimal Throughput Analysis of CR Networks', year: 2016, venue: 'QTNA', award: 'Best Student Paper', keywords: ['cognitive radio', 'throughput'] },
    ]
  },
  articles: {
    'ai-llm-8months': {
      title: 'AI LLM에 미쳐있던 8개월',
      content: '8개월간 ChatGPT, Claude, Gemini를 마스터하며 생산성 10배 향상',
      keywords: ['AI', 'LLM', '생산성', 'ChatGPT', 'Claude', 'Gemini']
    },
    'ai-apt-representative': {
      title: 'AI 없이는 불가능했던 동대표 활동',
      content: 'AI 도구를 활용한 아파트 동대표 업무 자동화',
      keywords: ['AI', '동대표', '자동화', '실무']
    },
    'serena-mcp-guide': {
      title: 'Serena MCP 설치 가이드',
      content: 'Claude Code와 Serena MCP 통합 방법',
      keywords: ['Serena', 'MCP', 'Claude Code', '개발도구']
    }
  },
  projects: {
    'edge-simulator': {
      title: 'Edge Computing GUI Simulator',
      description: '4년간 염원하던 프로젝트를 AI(o1-preview) 활용 1개월 만에 완성',
      keywords: ['edge computing', 'simulator', 'GUI', 'AI']
    },
    'ai-characters': {
      title: 'AI 캐릭터 대화 시스템',
      description: 'Gemini API 활용 해리포터 캐릭터 구현',
      keywords: ['AI', 'character', 'Gemini', 'Harry Potter']
    }
  }
};

// Search function
function searchContent(query) {
  const results = [];
  const queryLower = query.toLowerCase();
  const queryTokens = queryLower.split(/\s+/);
  
  // Search publications
  for (const pub of SITE_CONTENT.publications.journals) {
    const relevance = calculateRelevance(queryTokens, [
      pub.title.toLowerCase(),
      pub.journal.toLowerCase(),
      ...pub.keywords
    ]);
    if (relevance > 0) {
      results.push({
        type: 'publication',
        item: pub,
        relevance
      });
    }
  }
  
  // Search articles
  for (const [key, article] of Object.entries(SITE_CONTENT.articles)) {
    const relevance = calculateRelevance(queryTokens, [
      article.title.toLowerCase(),
      article.content.toLowerCase(),
      ...article.keywords
    ]);
    if (relevance > 0) {
      results.push({
        type: 'article',
        item: { ...article, key },
        relevance
      });
    }
  }
  
  // Search projects
  for (const [key, project] of Object.entries(SITE_CONTENT.projects)) {
    const relevance = calculateRelevance(queryTokens, [
      project.title.toLowerCase(),
      project.description.toLowerCase(),
      ...project.keywords
    ]);
    if (relevance > 0) {
      results.push({
        type: 'project',
        item: { ...project, key },
        relevance
      });
    }
  }
  
  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance);
  return results.slice(0, 5); // Top 5 results
}

function calculateRelevance(queryTokens, contentTokens) {
  let score = 0;
  const contentStr = contentTokens.join(' ');
  
  for (const token of queryTokens) {
    if (contentStr.includes(token)) {
      score += 1;
    }
  }
  
  return score;
}

// Determine action based on query
function determineAction(message) {
  const lowerMessage = message.toLowerCase();
  
  // Check for search intents
  if (lowerMessage.includes('논문') && (lowerMessage.includes('몇') || lowerMessage.includes('개수') || lowerMessage.includes('얼마나'))) {
    return {
      action: 'count_publications',
      thinking: '음, 정확히 세어보니...'
    };
  }
  
  if (lowerMessage.includes('엣지') || lowerMessage.includes('edge')) {
    return {
      action: 'search',
      query: 'edge computing',
      thinking: '제 연구 중에서 엣지 컴퓨팅 관련 내용을 찾아보니...'
    };
  }
  
  if (lowerMessage.includes('블로그') || lowerMessage.includes('글') || lowerMessage.includes('아티클')) {
    return {
      action: 'search',
      query: message,
      thinking: '제 글을 다시 한번 읽어보니...'
    };
  }
  
  if (lowerMessage.includes('프로젝트') || lowerMessage.includes('시뮬레이터')) {
    return {
      action: 'search',
      query: message,
      thinking: '제가 진행한 프로젝트들을 살펴보니...'
    };
  }
  
  if (lowerMessage.includes('공동연구') || lowerMessage.includes('같이') || lowerMessage.includes('공저')) {
    return {
      action: 'analyze_collaborators',
      thinking: '제 논문 공저자들을 확인해보니...'
    };
  }
  
  return {
    action: 'chat',
    thinking: null
  };
}

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

  if (event.httpMethod === 'POST') {
    try {
      const { message, history = [] } = JSON.parse(event.body);

      if (!message) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Message required' })
        };
      }

      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'API key not configured' })
        };
      }

      // Determine action
      const actionInfo = determineAction(message);
      
      // Prepare context based on action
      let searchResults = [];
      let additionalContext = '';
      
      if (actionInfo.action === 'search' && actionInfo.query) {
        searchResults = searchContent(actionInfo.query);
        additionalContext = `
검색 결과:
${searchResults.map(r => `- [${r.type}] ${r.item.title || r.item.name}: ${r.item.description || r.item.content || ''}`).join('\n')}
`;
      } else if (actionInfo.action === 'count_publications') {
        additionalContext = `
논문 통계:
- 국제저널: 25편 (1저자 4편, 교신저자 13편)
- 국제학회: 10편 (1저자 3편, 교신저자 2편)
- 엣지 컴퓨팅 관련: 7편 이상
- IEEE IoT Journal: 5편
`;
      } else if (actionInfo.action === 'analyze_collaborators') {
        additionalContext = `
주요 공동연구자:
- 이주형: 15편 (가장 많은 공저)
- 최준균: 14편 (지도교수)
- 오현택: 4편
- 황강욱: 4편
`;
      }

      // Generate prompt with context
      const prompt = `당신은 박상돈(Sangdon Park) 본인입니다. 실제 사람처럼 자연스럽게 대화하세요.

## 답변 규칙
- 자연스럽고 정중한 존댓말로 응답
- **짧고 간결하게** 답변 (1-2문장 기본)
- 검색이나 분석을 했다면 그 과정을 자연스럽게 언급
${additionalContext}

질문: ${message}`;

      // Call Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
              candidateCount: 1,
              topK: 40,
              topP: 0.95
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'AI service error' })
        };
      }

      const data = await response.json();
      let reply = 'Sorry, no response';
      
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        reply = data.candidates[0].content.parts[0].text;
      }

      // Prepare response with metadata
      const responseData = {
        reply,
        action: actionInfo.action,
        thinking: actionInfo.thinking,
        searchResults: searchResults.length > 0 ? searchResults.slice(0, 3) : null,
        metadata: {
          hasSearch: actionInfo.action === 'search',
          hasAnalysis: ['count_publications', 'analyze_collaborators'].includes(actionInfo.action)
        }
      };

      // Log to Supabase if configured
      const SUPABASE_URL = process.env.SUPABASE_URL;
      const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
      
      if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
        try {
          const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
          await supabase.from('chat_logs').insert([{
            user_message: message,
            bot_response: reply,
            conversation_history: history,
            action_taken: actionInfo.action,
            search_results: searchResults,
            created_at: new Date().toISOString(),
            user_ip: event.headers['x-forwarded-for'] || 'unknown'
          }]);
        } catch (logError) {
          console.error('Supabase logging error:', logError);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(responseData)
      };

    } catch (error) {
      console.error('Error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server error' })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};