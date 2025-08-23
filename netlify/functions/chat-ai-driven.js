const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Site content database for AI to search
const KNOWLEDGE_BASE = {
  publications: {
    all_papers: {
      'edge_computing': [
        "Real-Time Dynamic Pricing for Edge Computing Services (IEEE Access 2024, 1저자)",
        "Three Dynamic Pricing Schemes for Edge Computing (IEEE IoT Journal 2020, 교신)",
        "Power Efficient Clustering for 5G Mobile Edge Computing (Mobile Networks 2019, 교신)",
        "Optimal Pricing for Energy-Efficient MEC Offloading (IEEE Comm Letters 2018, 교신)",
        "Competitive Partial Computation Offloading (IEEE Access 2018, 교신)",
        "Edge Computing GUI Simulator 프로젝트 (2024)"
      ],
      'iot': [
        "Differential Pricing-Based Task Offloading for IoT (IEEE IoT Journal 2022, 교신)",
        "Joint Subcarrier and Transmission Power in WPT System (IEEE IoT Journal 2022, 교신)",
        "Multivariate-Time-Series-Prediction for IoT (IEEE IoT Journal 2022, 교신)",
        "Competitive Data Trading Model With Privacy Valuation (IEEE IoT Journal 2020, 교신)",
        "Personal Data Trading Scheme for IoT Data Marketplaces (IEEE Access 2019, 교신)"
      ],
      'energy': [
        "Contribution-Based Energy-Trading in Microgrids (IEEE TIE 2016, 1저자, IEEE ITeN 선정)",
        "Event-Driven Energy Trading System in Microgrids (IEEE Access 2017, 1저자)",
        "Time Series Forecasting Based Energy Trading (IEEE Access 2020, 교신)",
        "Battery-Wear-Model-Based Energy Trading in EVs (IEEE TII 2019, 교신)"
      ],
      'ai_ml': [
        "Resilient Linear Classification: Attack on Training Data (ACM/IEEE ICCPS 2017, 1저자)",
        "Learning-Based Adaptive Imputation Method With kNN (Energies 2017, 교신)",
        "Load Profile Extraction by Mean-Shift Clustering (Energies 2018, 교신)"
      ]
    },
    by_collaborator: {
      '이주형': [
        "Contribution-Based Energy-Trading in Microgrids (IEEE TIE 2016, 1저자, IEEE ITeN 선정)",
        "Event-Driven Energy Trading System in Microgrids (IEEE Access 2017, 1저자)",
        "Three Dynamic Pricing Schemes for Edge Computing (IEEE IoT Journal 2020, 교신)",
        "Battery-Wear-Model-Based Energy Trading in EVs (IEEE TII 2019, 교신)",
        "Power Efficient Clustering for 5G Mobile Edge Computing (Mobile Networks 2019, 교신)",
        "Learning-Based Adaptive Imputation Method With kNN (Energies 2017, 교신)",
        "Load Profile Extraction by Mean-Shift Clustering (Energies 2018, 교신)",
        "Competitive Partial Computation Offloading (IEEE Access 2018, 교신)",
        "Three Hierarchical Levels of Big-Data Market Model (IEEE Access 2018, 교신)",
        "Personal Data Trading Scheme for IoT Data Marketplaces (IEEE Access 2019, 교신)",
        "Three Dynamic Pricing Schemes for Resource Allocation (IEEE IoT Journal 2020, 교신)",
        "On-device AI-based Cognitive Detection of Bio-modality Spoofing (IEEE IoT Journal 2020, 교신)",
        "Energy Independence of Energy Trading System (ISGT Asia 2017)",
        "Energy-efficient sleep scheme for WLAN (NOMS 2016)",
        "Energy efficient relay selection scheme (ICTC 2013)"
      ],
      '최준균': [
        "Real-Time Dynamic Pricing for Edge Computing Services (IEEE Access 2024, 1저자)",
        "Contribution-Based Energy-Trading in Microgrids (IEEE TIE 2016, 1저자, IEEE ITeN 선정)",
        "Event-Driven Energy Trading System in Microgrids (IEEE Access 2017, 1저자)",
        "Optimal throughput analysis of CR networks (Annals of OR 2019, 1저자)",
        "Differential Pricing-Based Task Offloading for IoT (IEEE IoT Journal 2022, 교신)",
        "Joint Subcarrier and Transmission Power in WPT System (IEEE IoT Journal 2022, 교신)",
        "Multivariate-Time-Series-Prediction for IoT (IEEE IoT Journal 2022, 교신)",
        "Competitive Data Trading Model With Privacy Valuation (IEEE IoT Journal 2020, 교신)",
        "Battery-Wear-Model-Based Energy Trading in EVs (IEEE TII 2019, 교신)",
        "Three Dynamic Pricing Schemes for Edge Computing (IEEE IoT Journal 2020, 교신)",
        "Learning-Based Adaptive Imputation Method With kNN (Energies 2017, 교신)",
        "Competitive Partial Computation Offloading (IEEE Access 2018, 교신)",
        "Joint optimal access and sensing policy (ICUFN 2016)",
        "Optimal Throughput Analysis of Random Access Policies (QTNA 2016, Best Paper Award)"
      ],
      '황강욱': [
        "Contribution-Based Energy-Trading in Microgrids (IEEE TIE 2016, 1저자, IEEE ITeN 선정)",
        "Event-Driven Energy Trading System in Microgrids (IEEE Access 2017, 1저자)",
        "Time Series Forecasting Based Energy Trading (IEEE Access 2020, 교신)",
        "Optimal throughput analysis of CR networks (Annals of OR 2019, 1저자)"
      ],
      '오현택': [
        "Differential Pricing-Based Task Offloading for IoT (IEEE IoT Journal 2022, 교신)",
        "Competitive Data Trading Model With Privacy Valuation (IEEE IoT Journal 2020, 교신)",
        "Personal Data Trading Scheme for IoT Data Marketplaces (IEEE Access 2019, 교신)",
        "Energy-efficient sleep scheme for WLAN (NOMS 2016)"
      ]
    },
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
        const actionPrompt = `당신은 박상돈 본인입니다. 사용자 질문을 분석하고 어떤 행동을 할지 결정하세요.

사용 가능한 행동:
- SEARCH_PAPERS: 논문 관련 질문 (논문 찾기, 특정 주제 논문)
- COUNT_PAPERS: 논문 개수 질문 (몇 편, 얼마나)
- ANALYZE_COLLABORATORS: 공동연구자 질문 (누구와, 같이)
- SEARCH_COLLABORATOR_PAPERS: 특정 공동연구자와의 논문 리스트
- SEARCH_ARTICLES: 블로그/글 관련
- SEARCH_PROJECTS: 프로젝트 관련
- CHAT: 인사, 일반 대화, 위에 해당 안 되는 것

예시:
Q: "AI 논문 뭐 썼어?" → ACTION: SEARCH_PAPERS, QUERY: AI
Q: "황강욱 교수님과 쓴 논문?" → ACTION: SEARCH_COLLABORATOR_PAPERS, QUERY: 황강욱
Q: "논문 몇 편?" → ACTION: COUNT_PAPERS
Q: "안녕하세요" → ACTION: CHAT

반드시 이 형식으로 응답:
ACTION: [행동명]
QUERY: [검색어]
INITIAL_MESSAGE: [한국어로 자연스럽게. CHAT이면 완전한 답변, 아니면 "확인해보겠습니다" 류]

사용자: ${message}`;

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
        console.log('AI Decision Response:', actionData);
        const actionText = actionData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('AI Decision Text:', actionText);
        
        // Parse AI decision
        const actionMatch = actionText.match(/ACTION:\s*([^\n]+)/);
        const queryMatch = actionText.match(/QUERY:\s*([^\n]+)/);
        const initialMatch = actionText.match(/INITIAL_MESSAGE:\s*(.+)/s);
        
        const action = actionMatch ? actionMatch[1].trim() : 'CHAT';
        const query = queryMatch ? queryMatch[1].trim() : '';
        const initialMessage = initialMatch ? initialMatch[1].trim() : null;
        
        console.log('Parsed - Action:', action, 'Query:', query, 'Initial:', initialMessage);

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
          const queryLower = query.toLowerCase();
          
          if (queryLower.includes('엣지') || queryLower.includes('edge')) {
            searchResults = `엣지 컴퓨팅 관련 논문 (6편):\n${KNOWLEDGE_BASE.publications.all_papers.edge_computing.join('\n')}`;
          } else if (queryLower.includes('ai') || queryLower.includes('ml') || queryLower.includes('machine') || queryLower.includes('learning')) {
            searchResults = `AI/머신러닝 관련 논문 (3편):\n${KNOWLEDGE_BASE.publications.all_papers.ai_ml.join('\n')}\n\nAI 관련 프로젝트:\n- AI 캐릭터 대화 시스템 (Gemini API 활용)\n- Edge Computing GUI Simulator (AI o1-preview 활용 개발)`;
          } else if (queryLower.includes('iot')) {
            searchResults = `IoT 관련 논문 (5편):\n${KNOWLEDGE_BASE.publications.all_papers.iot.join('\n')}`;
          } else if (queryLower.includes('energy') || queryLower.includes('에너지')) {
            searchResults = `에너지 거래 관련 논문 (4편):\n${KNOWLEDGE_BASE.publications.all_papers.energy.join('\n')}`;
          } else {
            searchResults = KNOWLEDGE_BASE.publications.stats;
          }
        } else if (action === 'ANALYZE_COLLABORATORS') {
          searchResults = KNOWLEDGE_BASE.publications.collaborators;
        } else if (action === 'SEARCH_COLLABORATOR_PAPERS') {
          const queryLower = query.toLowerCase();
          
          if (queryLower.includes('황강욱') || queryLower.includes('hwang') || queryLower.includes('ganguk')) {
            const papers = KNOWLEDGE_BASE.publications.by_collaborator['황강욱'];
            searchResults = `황강욱 교수님과 함께 작성한 논문 (${papers.length}편):\n${papers.join('\n')}`;
          } else if (queryLower.includes('이주형') || queryLower.includes('joohyung') || queryLower.includes('lee')) {
            const papers = KNOWLEDGE_BASE.publications.by_collaborator['이주형'];
            searchResults = `이주형 교수님과 함께 작성한 논문 (${papers.length}편):\n${papers.join('\n')}`;
          } else if (queryLower.includes('최준균') || queryLower.includes('jun kyun') || queryLower.includes('choi')) {
            const papers = KNOWLEDGE_BASE.publications.by_collaborator['최준균'];
            searchResults = `최준균 교수님과 함께 작성한 논문 (${papers.length}편):\n${papers.join('\n')}`;
          } else if (queryLower.includes('오현택') || queryLower.includes('hyeontaek') || queryLower.includes('oh')) {
            const papers = KNOWLEDGE_BASE.publications.by_collaborator['오현택'];
            searchResults = `오현택 교수님과 함께 작성한 논문 (${papers.length}편):\n${papers.join('\n')}`;
          } else {
            // 모든 공동연구자 정보 제공
            searchResults = `주요 공동연구자:\n${KNOWLEDGE_BASE.publications.collaborators}\n\n특정 교수님과의 논문을 원하시면 이름을 말씀해주세요.`;
          }
        } else if (action === 'SEARCH_ARTICLES') {
          searchResults = KNOWLEDGE_BASE.articles.join('\n');
        } else if (action === 'SEARCH_PROJECTS') {
          searchResults = KNOWLEDGE_BASE.projects.join('\n');
        }

        // Generate final response with context
        const finalPrompt = `당신은 박상돈 본인입니다. 실제 사람처럼 자연스럽게 대화하세요.

사용자가 물어본 것: ${message}

내가 확인한 정보:
${searchResults}

위 정보를 바탕으로 사용자 질문에 정확하고 자연스럽게 답변하세요.
- 정보가 있으면 구체적으로 언급 (예: "네, 황강욱 교수님과는 에너지 트레이딩과 인지 무선 네트워크 관련 논문 4편을 함께 썼습니다")
- 리스트가 길면 주요 논문 2-3개만 간단히 언급
- 1-2문장으로 간결하게, 존댓말 사용
- 자연스러운 대화체로 응답`;

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
        console.log('Final Response from Gemini:', finalData);
        
        let reply = finalData?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        // Fallback if no reply
        if (!reply) {
          console.error('No reply generated, using fallback');
          reply = searchResults || '죄송합니다. 답변을 생성할 수 없습니다.';
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            step: 2,
            reply,
            searchResults: searchResults ? searchResults.split('\n').filter(s => s.trim()).slice(0, 3) : null
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