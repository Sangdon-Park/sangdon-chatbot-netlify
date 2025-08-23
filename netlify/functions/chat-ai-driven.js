const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Site content database for AI to search
const KNOWLEDGE_BASE = {
  publications: {
    journals: [
      "Real-Time Dynamic Pricing for Edge Computing Services (IEEE Access 2024)",
      "Dynamic Bandwidth Slicing in PON for Federated Learning (Sensors 2024)",
      "Differential Pricing-Based Task Offloading (IEEE IoT Journal 2022)",
      "Three Dynamic Pricing Schemes for Edge Computing (IEEE IoT Journal 2020)",
      "Competitive Data Trading Model With Privacy Valuation (IEEE IoT Journal 2020)",
      "Power Efficient Clustering for 5G Mobile Edge Computing (Mobile Networks 2019)",
      "Optimal Pricing for Energy-Efficient MEC Offloading (IEEE Comm Letters 2018)",
      // ... 총 25편
    ],
    stats: "총 25편 국제저널 (1저자 4편, 교신저자 13편), 10편 국제학회",
    collaborators: "이주형(15편), 최준균(14편), 오현택(4편), 황강욱(4편)"
  },
  articles: [
    "AI LLM에 미쳐있던 8개월 - ChatGPT, Claude, Gemini 마스터",
    "AI 없이는 불가능했던 동대표 활동",
    "Serena MCP 설치 가이드"
  ],
  projects: [
    "Edge Computing GUI Simulator - 4년 염원 1개월 완성",
    "AI 캐릭터 대화 시스템 - 해리포터 캐릭터 구현"
  ]
};

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
      const { message, history = [], step = 1 } = JSON.parse(event.body);

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

      // STEP 1: AI decides what action to take
      if (step === 1) {
        const actionPrompt = `당신은 박상돈의 AI 비서입니다. 사용자 질문을 분석하고 어떤 행동을 할지 결정하세요.

사용 가능한 행동:
1. "SEARCH_PAPERS": 논문 검색이 필요할 때
2. "COUNT_PAPERS": 논문 개수를 세야 할 때  
3. "ANALYZE_COLLABORATORS": 공동연구자 분석이 필요할 때
4. "SEARCH_ARTICLES": 블로그/아티클 검색이 필요할 때
5. "SEARCH_PROJECTS": 프로젝트 검색이 필요할 때
6. "CHAT": 일반 대화 (인사, 안부, 일상 대화 등)

다음 형식으로만 응답하세요:
ACTION: [행동명]
QUERY: [검색어 또는 분석 대상]
INITIAL_MESSAGE: [사용자에게 보낼 메시지 - CHAT인 경우 완전한 답변, 다른 경우 "확인해보겠습니다" 류의 메시지]

사용자 질문: ${message}`;

        const actionResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: actionPrompt }]
              }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 200
              }
            })
          }
        );

        const actionData = await actionResponse.json();
        const actionText = actionData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Parse AI decision
        const actionMatch = actionText.match(/ACTION:\s*(.+)/);
        const queryMatch = actionText.match(/QUERY:\s*(.+)/);
        const initialMatch = actionText.match(/INITIAL_MESSAGE:\s*(.+)/);
        
        const action = actionMatch ? actionMatch[1].trim() : 'CHAT';
        const query = queryMatch ? queryMatch[1].trim() : '';
        const initialMessage = initialMatch ? initialMatch[1].trim() : null;

        // Return initial response to show user
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            step: 1,
            action,
            query,
            initialMessage,
            needsSecondStep: action !== 'CHAT'
          })
        };
      }

      // STEP 2: Execute action and generate final response
      else if (step === 2) {
        const { action, query } = JSON.parse(event.body);
        
        let searchResults = '';
        
        // Execute the action
        if (action === 'SEARCH_PAPERS' || action === 'COUNT_PAPERS') {
          if (query.toLowerCase().includes('엣지') || query.toLowerCase().includes('edge')) {
            searchResults = `
엣지 컴퓨팅 관련 논문 (7편 이상):
- Real-Time Dynamic Pricing for Edge Computing Services (IEEE Access 2024)
- Three Dynamic Pricing Schemes for Edge Computing (IEEE IoT Journal 2020)  
- Power Efficient Clustering for 5G Mobile Edge Computing (2019)
- Optimal Pricing for Energy-Efficient MEC Offloading (2018)
외 다수`;
          } else if (query.toLowerCase().includes('ai') || query.toLowerCase().includes('llm')) {
            searchResults = `
AI/LLM 관련 연구는 주로 프로젝트와 블로그에 있습니다:
- AI 캐릭터 대화 시스템 프로젝트
- "AI LLM에 미쳐있던 8개월" 블로그 글
- 논문은 주로 IoT, 엣지 컴퓨팅, 에너지 거래 분야`;
          } else {
            searchResults = KNOWLEDGE_BASE.publications.stats;
          }
        } else if (action === 'ANALYZE_COLLABORATORS') {
          searchResults = KNOWLEDGE_BASE.publications.collaborators;
        } else if (action === 'SEARCH_ARTICLES') {
          searchResults = KNOWLEDGE_BASE.articles.join('\n');
        } else if (action === 'SEARCH_PROJECTS') {
          searchResults = KNOWLEDGE_BASE.projects.join('\n');
        }

        // Generate final response with context
        const finalPrompt = `당신은 박상돈 본인입니다. 방금 ${action} 작업을 완료했습니다.

검색/분석 결과:
${searchResults}

이제 사용자 질문에 자연스럽게 답변하세요. 짧고 간결하게 1-2문장으로.

원래 질문: ${message}`;

        const finalResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: finalPrompt }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 300
              }
            })
          }
        );

        const finalData = await finalResponse.json();
        const reply = finalData?.candidates?.[0]?.content?.parts?.[0]?.text || '답변을 생성할 수 없습니다.';

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            step: 2,
            reply,
            searchResults: searchResults ? searchResults.split('\n').slice(0, 3) : null
          })
        };
      }

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