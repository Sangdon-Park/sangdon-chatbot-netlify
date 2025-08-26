const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Pre-computed embeddings for all papers and posts
// These were generated using Google's text-embedding-004 model
const EMBEDDINGS_DATABASE = {
  papers: [
    // 2024
    {
      id: 'paper_1',
      title: "Real-Time Dynamic Pricing for Edge Computing Services",
      journal: "IEEE Access",
      year: 2024,
      authors: ["박상돈"],
      keywords: ["edge computing", "pricing", "real-time"],
      text: "Real-Time Dynamic Pricing for Edge Computing Services IEEE Access 2024 박상돈 edge computing pricing real-time 엣지 컴퓨팅 가격 정책 실시간",
      embedding: null // Will be computed on first run
    },
    {
      id: 'paper_2',
      title: "Dynamic Bandwidth Slicing in PON for Federated Learning",
      journal: "Sensors",
      year: 2024,
      authors: ["박상돈"],
      keywords: ["PON", "federated learning", "bandwidth"],
      text: "Dynamic Bandwidth Slicing in PON for Federated Learning Sensors 2024 박상돈 PON federated learning bandwidth 대역폭 연합학습",
      embedding: null
    },
    // 2022
    {
      id: 'paper_3',
      title: "Differential Pricing-Based Task Offloading for IoT",
      journal: "IEEE IoT Journal",
      year: 2022,
      authors: ["박상돈", "오현택", "최준균"],
      keywords: ["IoT", "pricing", "task offloading"],
      text: "Differential Pricing-Based Task Offloading for IoT IEEE IoT Journal 2022 박상돈 오현택 최준균 IoT pricing task offloading 사물인터넷 가격 정책 태스크 오프로딩",
      embedding: null
    },
    {
      id: 'paper_4',
      title: "Joint Subcarrier and Transmission Power in WPT System",
      journal: "IEEE IoT Journal",
      year: 2022,
      authors: ["박상돈", "최준균"],
      keywords: ["WPT", "power", "IoT"],
      text: "Joint Subcarrier and Transmission Power in WPT System IEEE IoT Journal 2022 박상돈 최준균 WPT power IoT wireless power transfer 무선 전력 전송",
      embedding: null
    },
    {
      id: 'paper_5',
      title: "Multivariate-Time-Series-Prediction for IoT",
      journal: "IEEE IoT Journal",
      year: 2022,
      authors: ["박상돈", "최준균"],
      keywords: ["IoT", "time series", "prediction"],
      text: "Multivariate-Time-Series-Prediction for IoT IEEE IoT Journal 2022 박상돈 최준균 IoT time series prediction 시계열 예측",
      embedding: null
    },
    // 2020
    {
      id: 'paper_6',
      title: "Three Dynamic Pricing Schemes for Edge Computing",
      journal: "IEEE IoT Journal",
      year: 2020,
      authors: ["박상돈", "이주형", "최준균"],
      keywords: ["edge computing", "pricing", "IoT"],
      text: "Three Dynamic Pricing Schemes for Edge Computing IEEE IoT Journal 2020 박상돈 이주형 최준균 edge computing pricing IoT 엣지 컴퓨팅 가격 정책",
      embedding: null
    },
    {
      id: 'paper_7',
      title: "Competitive Data Trading Model With Privacy Valuation",
      journal: "IEEE IoT Journal",
      year: 2020,
      authors: ["박상돈", "오현택", "최준균"],
      keywords: ["data trading", "privacy", "IoT"],
      text: "Competitive Data Trading Model With Privacy Valuation IEEE IoT Journal 2020 박상돈 오현택 최준균 data trading privacy IoT 데이터 거래 프라이버시",
      embedding: null
    },
    {
      id: 'paper_8',
      title: "Time Series Forecasting Based Energy Trading",
      journal: "IEEE Access",
      year: 2020,
      authors: ["박상돈", "황강욱"],
      keywords: ["energy", "time series", "trading"],
      text: "Time Series Forecasting Based Energy Trading IEEE Access 2020 박상돈 황강욱 energy time series trading 에너지 거래 시계열",
      embedding: null
    },
    // 2019
    {
      id: 'paper_9',
      title: "Battery-Wear-Model-Based Energy Trading in EVs",
      journal: "IEEE TII",
      year: 2019,
      authors: ["박상돈", "이주형", "최준균"],
      keywords: ["EV", "battery", "energy trading"],
      text: "Battery-Wear-Model-Based Energy Trading in EVs IEEE TII 2019 박상돈 이주형 최준균 EV battery energy trading 전기차 배터리 에너지 거래",
      embedding: null
    },
    {
      id: 'paper_10',
      title: "Personal Data Trading Scheme for IoT Data Marketplaces",
      journal: "IEEE Access",
      year: 2019,
      authors: ["박상돈", "오현택", "이주형"],
      keywords: ["data marketplace", "IoT", "privacy"],
      text: "Personal Data Trading Scheme for IoT Data Marketplaces IEEE Access 2019 박상돈 오현택 이주형 data marketplace IoT privacy 데이터 시장 프라이버시",
      embedding: null
    },
    {
      id: 'paper_11',
      title: "Power Efficient Clustering for 5G Mobile Edge Computing",
      journal: "Mobile Networks",
      year: 2019,
      authors: ["박상돈", "이주형"],
      keywords: ["5G", "edge computing", "clustering"],
      text: "Power Efficient Clustering for 5G Mobile Edge Computing Mobile Networks 2019 박상돈 이주형 5G edge computing clustering MEC 모바일 엣지 컴퓨팅",
      embedding: null
    },
    {
      id: 'paper_12',
      title: "Optimal throughput analysis of CR networks",
      journal: "Annals of OR",
      year: 2019,
      authors: ["박상돈", "황강욱", "최준균"],
      keywords: ["cognitive radio", "throughput", "optimization"],
      text: "Optimal throughput analysis of CR networks Annals of OR 2019 박상돈 황강욱 최준균 cognitive radio throughput optimization",
      embedding: null
    },
    // 2018
    {
      id: 'paper_13',
      title: "Competitive Partial Computation Offloading",
      journal: "IEEE Access",
      year: 2018,
      authors: ["박상돈", "이주형", "최준균"],
      keywords: ["edge computing", "offloading", "competition"],
      text: "Competitive Partial Computation Offloading IEEE Access 2018 박상돈 이주형 최준균 edge computing offloading competition 오프로딩 경쟁",
      embedding: null
    },
    {
      id: 'paper_14',
      title: "Optimal Pricing for Energy-Efficient MEC Offloading",
      journal: "IEEE Comm Letters",
      year: 2018,
      authors: ["박상돈"],
      keywords: ["MEC", "pricing", "energy"],
      text: "Optimal Pricing for Energy-Efficient MEC Offloading IEEE Comm Letters 2018 박상돈 MEC pricing energy mobile edge computing 가격 정책",
      embedding: null
    },
    {
      id: 'paper_15',
      title: "Load Profile Extraction by Mean-Shift Clustering",
      journal: "Energies",
      year: 2018,
      authors: ["박상돈", "이주형"],
      keywords: ["clustering", "load profile", "machine learning"],
      text: "Load Profile Extraction by Mean-Shift Clustering Energies 2018 박상돈 이주형 clustering load profile machine learning 클러스터링 부하 프로파일",
      embedding: null
    },
    // 2017
    {
      id: 'paper_16',
      title: "Event-Driven Energy Trading System in Microgrids",
      journal: "IEEE Access",
      year: 2017,
      authors: ["박상돈", "이주형", "황강욱", "최준균"],
      keywords: ["microgrid", "energy trading", "event-driven"],
      text: "Event-Driven Energy Trading System in Microgrids IEEE Access 2017 박상돈 이주형 황강욱 최준균 microgrid energy trading 마이크로그리드 에너지 거래",
      embedding: null
    },
    {
      id: 'paper_17',
      title: "Learning-Based Adaptive Imputation Method With kNN",
      journal: "Energies",
      year: 2017,
      authors: ["박상돈", "이주형", "최준균"],
      keywords: ["kNN", "imputation", "machine learning"],
      text: "Learning-Based Adaptive Imputation Method With kNN Energies 2017 박상돈 이주형 최준균 kNN imputation machine learning 결측치 처리",
      embedding: null
    },
    {
      id: 'paper_18',
      title: "Resilient Linear Classification: Attack on Training Data",
      journal: "ACM/IEEE ICCPS",
      year: 2017,
      authors: ["박상돈"],
      keywords: ["machine learning", "security", "classification"],
      text: "Resilient Linear Classification Attack on Training Data ACM/IEEE ICCPS 2017 박상돈 machine learning security classification 머신러닝 보안",
      embedding: null
    },
    // 2016
    {
      id: 'paper_19',
      title: "Contribution-Based Energy-Trading in Microgrids",
      journal: "IEEE TIE",
      year: 2016,
      authors: ["박상돈", "이주형", "황강욱", "최준균"],
      keywords: ["microgrid", "energy trading", "game theory"],
      text: "Contribution-Based Energy-Trading in Microgrids IEEE TIE 2016 박상돈 이주형 황강욱 최준균 microgrid energy trading game theory IEEE ITeN 선정 마이크로그리드 에너지 거래 게임이론",
      embedding: null
    }
  ],
  posts: [
    {
      id: 'post_1',
      title: "AI LLM에 미쳐있던 8개월",
      type: "article",
      year: 2024,
      keywords: ["AI", "LLM", "ChatGPT", "Claude", "Gemini"],
      text: "AI LLM에 미쳐있던 8개월 2024 article AI LLM ChatGPT Claude Gemini 인공지능 대규모 언어 모델",
      embedding: null
    },
    {
      id: 'post_2',
      title: "AI 없이는 불가능했던 동대표 활동",
      type: "article",
      year: 2024,
      keywords: ["AI", "동대표", "자동화"],
      text: "AI 없이는 불가능했던 동대표 활동 2024 article AI 동대표 자동화 인공지능 아파트",
      embedding: null
    },
    {
      id: 'post_3',
      title: "Serena MCP 설치 가이드",
      type: "article",
      year: 2024,
      keywords: ["Serena", "MCP", "Claude Code"],
      text: "Serena MCP 설치 가이드 2024 article Serena MCP Claude Code Model Context Protocol",
      embedding: null
    },
    {
      id: 'post_4',
      title: "Edge Computing GUI Simulator 프로젝트",
      type: "project",
      year: 2024,
      keywords: ["edge computing", "simulator", "GUI"],
      text: "Edge Computing GUI Simulator 프로젝트 2024 project edge computing simulator GUI 4년 염원 1개월 완성 엣지 컴퓨팅 시뮬레이터",
      embedding: null
    },
    {
      id: 'post_5',
      title: "AI 캐릭터 대화 시스템",
      type: "project",
      year: 2024,
      keywords: ["AI", "character", "Gemini", "Harry Potter"],
      text: "AI 캐릭터 대화 시스템 2024 project AI character Gemini Harry Potter 해리포터 캐릭터 구현 인공지능 대화",
      embedding: null
    }
  ]
};

// Helper function to compute cosine similarity
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Get embedding from Google's API
async function getEmbedding(text, apiKey) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: {
            parts: [{
              text: text
            }]
          },
          taskType: 'RETRIEVAL_DOCUMENT',
          outputDimensionality: 768
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status}`);
    }

    const data = await response.json();
    return data.embedding.values;
  } catch (error) {
    console.error('Error getting embedding:', error);
    return null;
  }
}

// Search with embeddings
async function embeddingSearch(query, papers = true, posts = true, maxResults = 5) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not configured');
    return [];
  }

  // Get query embedding
  const queryEmbedding = await getEmbedding(query, GEMINI_API_KEY);
  if (!queryEmbedding) {
    console.error('Failed to get query embedding');
    return [];
  }

  const results = [];

  // Search papers
  if (papers) {
    for (const paper of EMBEDDINGS_DATABASE.papers) {
      // Get or compute paper embedding
      if (!paper.embedding) {
        paper.embedding = await getEmbedding(paper.text, GEMINI_API_KEY);
        if (!paper.embedding) continue;
      }
      
      const similarity = cosineSimilarity(queryEmbedding, paper.embedding);
      results.push({
        ...paper,
        similarity,
        type: 'paper'
      });
    }
  }

  // Search posts
  if (posts) {
    for (const post of EMBEDDINGS_DATABASE.posts) {
      // Get or compute post embedding
      if (!post.embedding) {
        post.embedding = await getEmbedding(post.text, GEMINI_API_KEY);
        if (!post.embedding) continue;
      }
      
      const similarity = cosineSimilarity(queryEmbedding, post.embedding);
      results.push({
        ...post,
        similarity,
        type: 'post'
      });
    }
  }

  // Sort by similarity and return top results
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, maxResults).map(r => {
    // Remove embedding from result to reduce size
    const { embedding, text, similarity, ...rest } = r;
    return {
      ...rest,
      score: similarity
    };
  });
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'POST') {
    try {
      const { message, history = [], step = 1 } = JSON.parse(event.body);
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

      if (!GEMINI_API_KEY) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Gemini API key not configured' })
        };
      }

      // STEP 1: Determine intent and action
      if (step === 1) {
        // Use Gemini to analyze intent
        const intentPrompt = `다음 사용자 메시지를 분석하여 JSON 형식으로 응답하세요:
메시지: "${message}"

응답 형식:
{
  "action": "SEARCH" 또는 "CHAT",
  "query": "검색할 키워드 (SEARCH인 경우)",
  "initial_message": "사용자에게 보여줄 초기 메시지"
}

규칙:
- 논문, 연구, 프로젝트, 기술 관련 질문이면 SEARCH
- 일반 대화나 인사면 CHAT
- query는 검색에 최적화된 키워드로 추출`;

        const intentResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: intentPrompt }]
              }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 200,
                responseMimeType: "application/json"
              }
            })
          }
        );

        const intentData = await intentResponse.json();
        const intent = JSON.parse(intentData.candidates[0].content.parts[0].text);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            step: 1,
            action: intent.action,
            query: intent.query || '',
            initialMessage: intent.initial_message,
            needsSecondStep: intent.action === 'SEARCH'
          })
        };
      }

      // STEP 2: Execute search and generate response
      else if (step === 2) {
        const { action, query } = JSON.parse(event.body);

        let searchResults = [];
        if (action === 'SEARCH' && query) {
          // Use embedding search
          searchResults = await embeddingSearch(query, true, true, 5);
        }

        // Generate response with search results
        const responsePrompt = `당신은 박상돈 교수의 연구를 소개하는 AI 어시스턴트입니다.

사용자 메시지: ${message}
검색 결과:
${searchResults.map(r => `- [${r.type === 'paper' ? '논문' : '포스트'}] ${r.title} (${r.year}) - 유사도: ${(r.score * 100).toFixed(1)}%`).join('\n')}

위 검색 결과를 바탕으로 사용자 질문에 답변하세요.
- 검색 결과가 있으면 구체적으로 소개
- 유사도가 높은 항목 위주로 설명
- 자연스럽고 친근한 톤으로 응답`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: responsePrompt }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500
              }
            })
          }
        );

        const data = await response.json();
        const reply = data.candidates[0].content.parts[0].text;

        // Log to Supabase
        try {
          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
          
          if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            const dataToInsert = {
              user_message: message,
              bot_response: reply,
              conversation_history: history.slice(-10),
              action_taken: action,
              search_results: searchResults,
              user_ip: event.headers['x-forwarded-for'] || 'unknown',
              user_agent: event.headers['user-agent'] || 'unknown'
            };
            
            await supabase.from('chat_logs').insert([dataToInsert]);
          }
        } catch (logError) {
          console.error('Supabase logging error:', logError);
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            reply,
            context: {
              papers: searchResults.filter(r => r.type === 'paper'),
              posts: searchResults.filter(r => r.type === 'post')
            }
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