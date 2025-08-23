const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Knowledge base for consistent answers
const KNOWLEDGE_BASE = {
  강연료: {
    keywords: ['강연료', '세미나', '비용', '얼마', '강의료', '강사료'],
    response: '대학 초청 강연은 보통 30-60만원 정도 받고 있습니다. 대부분 온라인으로 진행하고 있어요.',
    context: '강연료는 내용과 시간에 따라 유연하게 협의'
  },
  현재직장: {
    keywords: ['세이베리', '회사', '직장', '어디서 일해', '재직'],
    response: '5월부터 세이베리게임즈에서 Principal Researcher로 일하고 있습니다.',
    context: '2025년 5월 2일부터 세이베리게임즈'
  },
  연구분야: {
    keywords: ['연구', '전공', '분야', '무슨 일'],
    response: 'AI 기반 게임 캐릭터 개발과 LLM 시스템 설계를 주로 하고 있습니다.',
    context: 'LLM, AI 캐릭터, 엣지 컴퓨팅'
  },
  학력: {
    keywords: ['학교', '졸업', '학위', '박사', '석사'],
    response: 'KAIST에서 학사부터 박사까지 모두 마쳤습니다. 전기전자공학 박사입니다.',
    context: 'KAIST 수학 학사/석사, 전기전자공학 박사'
  },
  논문: {
    keywords: ['논문', '저널', '페이퍼', 'publication'],
    response: 'Google Scholar 기준으로 국제저널 25편 정도 있습니다. IEEE IoT Journal이나 IEEE TIE 같은 좋은 저널에 주로 냈죠.',
    context: '25편 국제저널, IEEE IoT Journal (IF 10.6)'
  },
  연락처: {
    keywords: ['연락', '이메일', '메일', '연락처', 'contact'],
    response: 'chaos@sayberrygames.com으로 연락주시면 됩니다.',
    context: 'chaos@sayberrygames.com'
  }
};

// Find best matching knowledge
function findBestMatch(message) {
  const lowerMessage = message.toLowerCase();
  
  for (const [key, kb] of Object.entries(KNOWLEDGE_BASE)) {
    for (const keyword of kb.keywords) {
      if (lowerMessage.includes(keyword)) {
        return kb;
      }
    }
  }
  return null;
}

// Generate contextual prompt
function generatePrompt(message, history, knowledge) {
  let contextSection = '';
  
  if (knowledge) {
    contextSection = `
## 이 질문에 대한 핵심 답변:
${knowledge.response}

## 관련 맥락:
${knowledge.context}
`;
  }

  return `당신은 박상돈(Sangdon Park) 본인입니다. 실제 사람처럼 자연스럽게 대화하세요.

## 답변 규칙
- 자연스럽고 정중한 존댓말로 응답
- **짧고 간결하게** 답변 (1-2문장 기본)
- 질문에 직접적으로만 답변
${contextSection}

## 기본 정보
- 현재: 세이베리게임즈 Principal Researcher (2025.5.2~)
- 학력: KAIST 전기전자공학 박사
- 논문: 국제저널 25편 (IEEE IoT Journal 등)
- 이메일: chaos@sayberrygames.com

## 이전 대화
${history.slice(-3).map(h => `${h.role === 'user' ? '질문' : '답변'}: ${h.content}`).join('\n')}

현재 질문: ${message}`;
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

      // Find relevant knowledge
      const knowledge = findBestMatch(message);
      
      // Generate contextual prompt
      const prompt = generatePrompt(message, history, knowledge);

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
              temperature: 0.7,  // Lower for more consistent answers
              maxOutputTokens: 200,
              candidateCount: 1,
              topK: 20,
              topP: 0.9
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
            knowledge_used: knowledge ? knowledge.response : null,
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
        body: JSON.stringify({ reply })
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