const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const { getCachedEmbedding, setCachedEmbedding } = require('./embeddings-cache');

// Pre-computed embeddings for common queries (to reduce API calls)
const COMMON_EMBEDDINGS = {
  // Pre-compute these on server start
  "세미나 몇 번": null,
  "논문 몇 편": null,
  "강연료 얼마": null,
  "AI 세미나": null,
  "KAIST 세미나": null,
  "최근 논문": null,
  "공동연구자": null
};

// Enhanced database with proper search capability
const POSTS_DATABASE = [
  { title: "AI LLM에 미쳐있던 8개월", type: "article", keywords: ["AI", "LLM", "ChatGPT", "Claude", "Gemini"], year: 2024 },
  { title: "AI 없이는 불가능했던 동대표 활동", type: "article", keywords: ["AI", "동대표", "자동화"], year: 2024 },
  { title: "Serena MCP 설치 가이드", type: "article", keywords: ["Serena", "MCP", "Claude Code"], year: 2024 },
  { title: "Edge Computing GUI Simulator 프로젝트", type: "project", keywords: ["edge computing", "simulator", "GUI"], year: 2024, description: "4년 염원 1개월 완성" },
  { title: "AI 캐릭터 대화 시스템", type: "project", keywords: ["AI", "character", "Gemini", "Harry Potter"], year: 2024, description: "해리포터 캐릭터 구현" }
];

// Talks database - updated from cv-ko.tex (13 seminars)
const TALKS_DATABASE = [
  { title: "연구자를 위한 AI 세미나", type: "ai_seminar", venue: "경상국립대학교 정보통계학과", year: 2025, date: "2025년 8월 25일", 
    keywords: ["AI", "연구자", "경상국립대", "정보통계", "seminar", "세미나", "강연", "초청강연", 
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000, completed: true },
  { title: "LLM과 RAG 기술로 구현하는 차세대 AI NPC", type: "conference", venue: "BIEN 2025 IT 과학세션, 대전 ICC 호텔", year: 2025, date: "2025년 8월 21일", 
    keywords: ["LLM", "RAG", "AI", "NPC", "BIEN", "대전", "ICC", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000, completed: true },
  { title: "지역역량 구축 교육 AI/LLM 세미나", type: "ai_seminar", venue: "대전광역시 유성구청", year: 2025, date: "2025년 8월 11일", 
    keywords: ["AI", "LLM", "지역역량", "유성구청", "대전", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000, completed: true },
  { title: "연구자를 위한 AI 세미나", type: "ai_seminar", venue: "고려대학교 화공생명공학과", year: 2025, date: "2025년 7월 31일 & 8월 6일", 
    keywords: ["AI", "연구자", "고려대", "화공생명", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000, completed: true },
  { title: "AI 세미나", type: "ai_seminar", venue: "부경대학교 전자정보통신공학부", year: 2025, date: "2025년 5월 14일", 
    keywords: ["AI", "부경대", "전자정보통신", "seminar", "세미나", "강연", "초청강연", 
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000, completed: true },
  { title: "AI 반도체학과 최고경영자과정 AI/LLM 세미나", type: "executive_course", venue: "KAIST", year: 2025, date: "2025년 5월 7일", 
    keywords: ["AI반도체", "LLM", "KAIST", "최고경영자", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000, completed: true },
  { title: "수학 콜로퀴움 AI 세미나", type: "mathematics_colloquium", venue: "한국과학영재학교", year: 2025, date: "2025년 4월 30일", 
    keywords: ["수학", "AI", "한국과학영재학교", "KAIST", "콜로퀴움", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000, completed: true },
  { title: "AI 세미나", type: "ai_seminar", venue: "경북대학교", year: 2025, date: "2025년 4월 24일", 
    keywords: ["AI", "경북대", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000, completed: true },
  { title: "AI 세미나", type: "ai_seminar", venue: "충남대학교 컴퓨터융합학부", year: 2025, date: "2025년 4월 14일", 
    keywords: ["AI", "충남대", "컴퓨터융합", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000, completed: true },
  { title: "AI 세미나", type: "ai_seminar", venue: "KAIST 전기및전자공학부", year: 2024, date: "2024년 12월 18일", 
    keywords: ["AI", "KAIST", "전기전자", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000, completed: true },
  { title: "AI 세미나", type: "ai_seminar", venue: "경희대학교(국제캠퍼스) 정보전자신소재공학과", year: 2024, date: "2024년 11월 29일", 
    keywords: ["AI", "경희대", "국제캠퍼스", "정보전자신소재", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000, completed: true },
  { title: "AI 세미나", type: "ai_seminar", venue: "KAIST 전기및전자공학부", year: 2024, date: "2024년 11월 28일", 
    keywords: ["AI", "KAIST", "전기전자", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000, completed: true },
  { title: "BK21 FOUR AI 세미나", type: "bk21_four", venue: "전북대학교 JIANT-IT 인재양성 사업단", year: 2023, date: "2023년 6월 1일", 
    keywords: ["AI", "전북대", "JIANT", "BK21", "인재양성", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000, completed: true }
];

// Copy the PAPERS_DATABASE from the original file...
const PAPERS_DATABASE = require('./papers-complete').PAPERS_DATABASE;

// Helper function to get embedding from Google's API with caching
async function getEmbedding(text, apiKey) {
  // Check cache first
  const cached = getCachedEmbedding(text);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: {
            parts: [{ text: text }]
          },
          taskType: 'RETRIEVAL_DOCUMENT',
          outputDimensionality: 768  // Use smaller dimension for speed
        })
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const embedding = data.embedding.values;
    
    // Cache the embedding
    setCachedEmbedding(text, embedding);
    
    return embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    return null;
  }
}

// Optimized cosine similarity
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Main handler
exports.handler = async function(event, context) {
  // Set function timeout hint
  context.callbackWaitsForEmptyEventLoop = false;
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { message, history = [], step } = JSON.parse(event.body);
    
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' })
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

    // STEP 1: Faster classification with parallel processing
    if (step === 1) {
      // Start both tasks in parallel
      const [actionPromise, embeddingPromise] = await Promise.all([
        // AI classification with faster model
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `당신은 박상돈입니다. 아주 간단히 답하세요.
사용자: ${message}

ACTION: SEARCH 또는 CHAT
QUERY: (검색어, SEARCH일 때만)
MESSAGE: (한국어로 짧게)`
                }]
              }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 100
              }
            })
          }
        ),
        // Start embedding computation early
        getEmbedding(message, GEMINI_API_KEY)
      ]);

      const actionResponse = await actionPromise;
      const actionData = await actionResponse.json();
      const actionText = actionData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Parse response
      const actionMatch = actionText.match(/ACTION:\s*([^\n]+)/);
      const queryMatch = actionText.match(/QUERY:\s*([^\n]+)/);
      const messageMatch = actionText.match(/MESSAGE:\s*(.+)/s);
      
      const action = actionMatch ? actionMatch[1].trim() : 'SEARCH';
      const query = queryMatch ? queryMatch[1].trim() : message;
      const initialMessage = messageMatch ? messageMatch[1].trim() : 
        (action === 'CHAT' ? '안녕하세요! 박상돈입니다.' : '확인해보겠습니다.');

      // Save embedding result for step 2
      global.lastEmbedding = await embeddingPromise;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          step: 1,
          action,
          query,
          initialMessage,
          needsSecondStep: action === 'SEARCH'
        })
      };
    }

    // STEP 2: Execute search and generate response
    else if (step === 2) {
      const { action, query } = JSON.parse(event.body);
      
      // Quick checks for deterministic responses
      const lowerMsg = message.toLowerCase();
      
      // Seminar count check
      if (lowerMsg.includes('세미나') && (lowerMsg.includes('몇') || lowerMsg.includes('개수'))) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            step: 2,
            reply: `총 13회의 초청 세미나를 진행했습니다. 최근에는 경상국립대(8월), BIEN 컨퍼런스(8월), 고려대(7-8월) 등에서 진행했고, KAIST, 경북대, 충남대, 경희대, 전북대 등 주요 대학에서도 세미나를 진행했습니다. 1회당 약 1시간 30분 진행하며, 강연료는 50만원입니다.`,
            searchResults: TALKS_DATABASE.map(t => `[세미나] ${t.title} - ${t.venue}`)
          })
        };
      }

      // Paper count check
      if (lowerMsg.includes('논문') && (lowerMsg.includes('몇') || lowerMsg.includes('개수'))) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            step: 2,
            reply: `국제저널에 총 25편의 논문을 발표했습니다. IEEE, Sensors, Energies 등 주요 저널에 게재했으며, 제1저자 4편, 교신저자 13편입니다.`,
            searchResults: [`총 25편의 국제저널 논문 (제1저자: 4편, 교신저자: 13편)`]
          })
        };
      }

      // Embedding search with reused embedding
      let searchResults = [];
      const queryEmbedding = global.lastEmbedding || await getEmbedding(query, GEMINI_API_KEY);
      
      if (queryEmbedding) {
        // Search with smaller batch size for speed
        const results = [];
        
        // Check seminars first
        for (const talk of TALKS_DATABASE.slice(0, 5)) { // Limit to recent seminars
          const docText = `${talk.title} ${talk.venue} ${talk.keywords.join(' ')}`;
          const docEmbedding = await getEmbedding(docText, GEMINI_API_KEY);
          if (docEmbedding) {
            const similarity = cosineSimilarity(queryEmbedding, docEmbedding);
            if (similarity > 0.3) {
              results.push({
                text: `[세미나] ${talk.title} - ${talk.venue}`,
                score: similarity
              });
            }
          }
        }
        
        // Sort and get top results
        results.sort((a, b) => b.score - a.score);
        searchResults = results.slice(0, 5).map(r => r.text);
      }

      // Generate final response with context about timing
      const currentDate = new Date('2025-08-27'); // Today's date
      const contextPrompt = `당신은 박상돈 본인입니다. 오늘은 2025년 8월 27일입니다.

검색 결과:
${searchResults.join('\n')}

중요 정보:
- 초청 세미나: 총 13회 완료 (2023-2025년)
- 최근 세미나: 경상국립대(8/25), BIEN(8/21), 유성구청(8/11), 고려대(7/31, 8/6) - 모두 완료
- 세미나 강연료: 1회당 50만원, 약 1시간 30분
- 논문: 총 25편의 국제저널 논문

답변할 때 시제 주의:
- 8월 27일 기준으로 이미 지난 세미나는 "진행했습니다" (과거형)
- 아직 안 한 세미나는 "예정입니다" (미래형)

사용자 질문: ${message}

한국어로 자연스럽고 정확하게 답변하세요.`;

      const finalResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: contextPrompt }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 500
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
          searchResults
        })
      };
    }

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};