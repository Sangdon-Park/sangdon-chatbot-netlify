const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Enhanced database with proper search capability
const PAPERS_DATABASE = [
  // 2024
  { title: "Real-Time Dynamic Pricing for Edge Computing Services", journal: "IEEE Access", year: 2024, role: "1저자", authors: ["박상돈"], keywords: ["edge computing", "pricing", "real-time"] },
  { title: "Dynamic Bandwidth Slicing in PON for Federated Learning", journal: "Sensors", year: 2024, role: "교신", authors: ["박상돈"], keywords: ["PON", "federated learning", "bandwidth"] },
  
  // 2022
  { title: "Differential Pricing-Based Task Offloading for IoT", journal: "IEEE IoT Journal", year: 2022, role: "교신", authors: ["박상돈", "오현택", "최준균"], keywords: ["IoT", "pricing", "task offloading"] },
  { title: "Joint Subcarrier and Transmission Power in WPT System", journal: "IEEE IoT Journal", year: 2022, role: "교신", authors: ["박상돈", "최준균"], keywords: ["WPT", "power", "IoT"] },
  { title: "Multivariate-Time-Series-Prediction for IoT", journal: "IEEE IoT Journal", year: 2022, role: "교신", authors: ["박상돈", "최준균"], keywords: ["IoT", "time series", "prediction"] },
  
  // 2020
  { title: "Three Dynamic Pricing Schemes for Edge Computing", journal: "IEEE IoT Journal", year: 2020, role: "교신", authors: ["박상돈", "이주형", "최준균"], keywords: ["edge computing", "pricing", "IoT"] },
  { title: "Competitive Data Trading Model With Privacy Valuation", journal: "IEEE IoT Journal", year: 2020, role: "교신", authors: ["박상돈", "오현택", "최준균"], keywords: ["data trading", "privacy", "IoT"] },
  { title: "Time Series Forecasting Based Energy Trading", journal: "IEEE Access", year: 2020, role: "교신", authors: ["박상돈", "황강욱"], keywords: ["energy", "time series", "trading"] },
  
  // 2019
  { title: "Battery-Wear-Model-Based Energy Trading in EVs", journal: "IEEE TII", year: 2019, role: "교신", authors: ["박상돈", "이주형", "최준균"], keywords: ["EV", "battery", "energy trading"] },
  { title: "Personal Data Trading Scheme for IoT Data Marketplaces", journal: "IEEE Access", year: 2019, role: "교신", authors: ["박상돈", "오현택", "이주형"], keywords: ["data marketplace", "IoT", "privacy"] },
  { title: "Power Efficient Clustering for 5G Mobile Edge Computing", journal: "Mobile Networks", year: 2019, role: "교신", authors: ["박상돈", "이주형"], keywords: ["5G", "edge computing", "clustering"] },
  { title: "Optimal throughput analysis of CR networks", journal: "Annals of OR", year: 2019, role: "1저자", authors: ["박상돈", "황강욱", "최준균"], keywords: ["cognitive radio", "throughput", "optimization"] },
  
  // 2018
  { title: "Competitive Partial Computation Offloading", journal: "IEEE Access", year: 2018, role: "교신", authors: ["박상돈", "이주형", "최준균"], keywords: ["edge computing", "offloading", "competition"] },
  { title: "Optimal Pricing for Energy-Efficient MEC Offloading", journal: "IEEE Comm Letters", year: 2018, role: "교신", authors: ["박상돈"], keywords: ["MEC", "pricing", "energy"] },
  { title: "Load Profile Extraction by Mean-Shift Clustering", journal: "Energies", year: 2018, role: "교신", authors: ["박상돈", "이주형"], keywords: ["clustering", "load profile", "machine learning"] },
  
  // 2017
  { title: "Event-Driven Energy Trading System in Microgrids", journal: "IEEE Access", year: 2017, role: "1저자", authors: ["박상돈", "이주형", "황강욱", "최준균"], keywords: ["microgrid", "energy trading", "event-driven"] },
  { title: "Learning-Based Adaptive Imputation Method With kNN", journal: "Energies", year: 2017, role: "교신", authors: ["박상돈", "이주형", "최준균"], keywords: ["kNN", "imputation", "machine learning"] },
  { title: "Resilient Linear Classification: Attack on Training Data", journal: "ACM/IEEE ICCPS", year: 2017, role: "1저자", authors: ["박상돈"], keywords: ["machine learning", "security", "classification"] },
  
  // 2016
  { title: "Contribution-Based Energy-Trading in Microgrids", journal: "IEEE TIE", year: 2016, role: "1저자", authors: ["박상돈", "이주형", "황강욱", "최준균"], keywords: ["microgrid", "energy trading", "game theory"], award: "IEEE ITeN 선정" }
];

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
- SEARCH: 논문, 공동연구자, 주제 등 모든 검색 관련 질문
- CHAT: 인사, 일반 대화, 검색이 필요 없는 것

예시:
Q: "AI 논문 뭐 썼어?" → ACTION: SEARCH, QUERY: AI 논문
Q: "황강욱 교수님과 쓴 논문?" → ACTION: SEARCH, QUERY: 황강욱
Q: "논문 몇 편?" → ACTION: SEARCH, QUERY: 논문 개수 통계
Q: "안녕하세요" → ACTION: CHAT

반드시 이 형식으로 응답:
ACTION: [SEARCH 또는 CHAT]
QUERY: [검색어 - SEARCH일 때만]
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
        
        // Execute intelligent search
        if (action === 'SEARCH') {
          const queryLower = query.toLowerCase();
          
          // Smart search through papers database
          const results = [];
          
          // Search for collaborator-specific papers
          if (queryLower.includes('황강욱') || queryLower.includes('hwang')) {
            const papers = PAPERS_DATABASE.filter(p => p.authors.includes('황강욱'));
            results.push(...papers.map(p => `${p.title} (${p.journal} ${p.year}, ${p.role})${p.award ? ' - ' + p.award : ''}`));
            searchResults = `황강욱 교수님과 함께 작성한 논문 (${results.length}편):\n${results.join('\n')}`;
          } else if (queryLower.includes('이주형') || queryLower.includes('joohyung')) {
            const papers = PAPERS_DATABASE.filter(p => p.authors.includes('이주형'));
            results.push(...papers.map(p => `${p.title} (${p.journal} ${p.year}, ${p.role})`));
            searchResults = `이주형 교수님과 함께 작성한 논문 (${results.length}편):\n${results.join('\n')}`;
          } else if (queryLower.includes('최준균') || queryLower.includes('choi')) {
            const papers = PAPERS_DATABASE.filter(p => p.authors.includes('최준균'));
            results.push(...papers.map(p => `${p.title} (${p.journal} ${p.year}, ${p.role})`));
            searchResults = `최준균 교수님과 함께 작성한 논문 (${results.length}편):\n${results.join('\n')}`;
          } else if (queryLower.includes('오현택')) {
            const papers = PAPERS_DATABASE.filter(p => p.authors.includes('오현택'));
            results.push(...papers.map(p => `${p.title} (${p.journal} ${p.year}, ${p.role})`));
            searchResults = `오현택 교수님과 함께 작성한 논문 (${results.length}편):\n${results.join('\n')}`;
          }
          // Search by topic/keyword
          else if (queryLower.includes('edge') || queryLower.includes('엣지')) {
            const papers = PAPERS_DATABASE.filter(p => p.keywords.some(k => k.includes('edge')));
            results.push(...papers.map(p => `${p.title} (${p.journal} ${p.year}, ${p.role})`));
            searchResults = `엣지 컴퓨팅 관련 논문 (${results.length}편):\n${results.join('\n')}`;
          } else if (queryLower.includes('iot')) {
            const papers = PAPERS_DATABASE.filter(p => p.keywords.some(k => k.includes('iot')) || p.keywords.some(k => k.includes('IoT')));
            results.push(...papers.map(p => `${p.title} (${p.journal} ${p.year}, ${p.role})`));
            searchResults = `IoT 관련 논문 (${results.length}편):\n${results.join('\n')}`;
          } else if (queryLower.includes('energy') || queryLower.includes('에너지')) {
            const papers = PAPERS_DATABASE.filter(p => p.keywords.some(k => k.includes('energy')));
            results.push(...papers.map(p => `${p.title} (${p.journal} ${p.year}, ${p.role})`));
            searchResults = `에너지 관련 논문 (${results.length}편):\n${results.join('\n')}`;
          } else if (queryLower.includes('ai') || queryLower.includes('machine') || queryLower.includes('learning')) {
            const papers = PAPERS_DATABASE.filter(p => p.keywords.some(k => k.includes('machine learning') || k.includes('classification') || k.includes('clustering') || k.includes('kNN')));
            results.push(...papers.map(p => `${p.title} (${p.journal} ${p.year}, ${p.role})`));
            searchResults = `AI/머신러닝 관련 논문 (${results.length}편):\n${results.join('\n')}`;
          }
          // Count papers
          else if (queryLower.includes('몇') || queryLower.includes('개수') || queryLower.includes('통계')) {
            const firstAuthorCount = PAPERS_DATABASE.filter(p => p.role === '1저자').length;
            const correspondingCount = PAPERS_DATABASE.filter(p => p.role === '교신').length;
            const journalCount = PAPERS_DATABASE.filter(p => !p.journal.includes('Conference') && !p.journal.includes('ICCPS') && !p.journal.includes('QTNA') && !p.journal.includes('ICUFN')).length;
            
            // Count unique collaborators
            const collaborators = {};
            PAPERS_DATABASE.forEach(p => {
              p.authors.forEach(author => {
                if (author !== '박상돈') {
                  collaborators[author] = (collaborators[author] || 0) + 1;
                }
              });
            });
            
            const sortedCollaborators = Object.entries(collaborators)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([name, count]) => `${name}(${count}편)`)
              .join(', ');
            
            searchResults = `논문 통계:\n총 ${PAPERS_DATABASE.length}편 (국제저널 ${journalCount}편)\n1저자 ${firstAuthorCount}편, 교신저자 ${correspondingCount}편\n주요 공동연구자: ${sortedCollaborators}`;
          }
          // Search by year
          else if (queryLower.match(/\d{4}/)) {
            const year = parseInt(queryLower.match(/\d{4}/)[0]);
            const papers = PAPERS_DATABASE.filter(p => p.year === year);
            results.push(...papers.map(p => `${p.title} (${p.journal}, ${p.role})`));
            searchResults = `${year}년 논문 (${results.length}편):\n${results.join('\n')}`;
          }
          // Articles and projects
          else if (queryLower.includes('블로그') || queryLower.includes('글') || queryLower.includes('아티클')) {
            searchResults = KNOWLEDGE_BASE.articles.join('\n');
          } else if (queryLower.includes('프로젝트')) {
            searchResults = KNOWLEDGE_BASE.projects.join('\n');
          }
          // Default: show recent papers
          else {
            const recentPapers = PAPERS_DATABASE.slice(0, 5);
            results.push(...recentPapers.map(p => `${p.title} (${p.journal} ${p.year}, ${p.role})`));
            searchResults = `최근 논문:\n${results.join('\n')}`;
          }
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